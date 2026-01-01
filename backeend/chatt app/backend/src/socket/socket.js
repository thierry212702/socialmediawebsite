import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Post from "../models/Post.model.js";
import Notification from "../models/Notification.model.js";
import jwt from "jsonwebtoken";

export const socketHandler = (io) => {
    const userSocketMap = {}; // userId: socketId

    // ========== SOCKET AUTHENTICATION MIDDLEWARE ==========
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

            if (!token) {
                console.log("❌ No token provided for socket connection");
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;

            console.log(`✅ Socket authenticated for user: ${socket.username} (${socket.userId})`);
            next();
        } catch (error) {
            console.error("❌ Socket authentication error:", error.message);
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("✅ A user connected:", socket.id, "User ID:", socket.userId);

        const userId = socket.userId;

        // Check if user is already connected
        if (userSocketMap[userId]) {
            console.log(`⚠️  User ${userId} already connected. Closing previous connection.`);
            io.to(userSocketMap[userId]).emit("forceDisconnect", "New connection established");
            io.sockets.sockets.get(userSocketMap[userId])?.disconnect();
        }

        // Store user socket connection
        userSocketMap[userId] = socket.id;

        // Notify all users about online users
        io.emit("onlineUsers", Object.keys(userSocketMap));

        // Update user status to online
        User.findByIdAndUpdate(userId, {
            status: "online",
            lastSeen: new Date()
        }, { new: true })
            .then((user) => {
                // Notify others that this user is online
                socket.broadcast.emit("userStatusChanged", {
                    userId,
                    status: "online",
                    profilePicture: user.profilePicture,
                    username: user.username
                });

                // Send online users list to the newly connected user
                socket.emit("onlineUsers", Object.keys(userSocketMap));
                console.log(`👥 Online users: ${Object.keys(userSocketMap).length} users`);
            })
            .catch(error => {
                console.error("Error updating user status:", error);
            });

        // ========== CHAT EVENTS ==========

        // Join a conversation room
        socket.on("joinConversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`💬 User ${userId} joined conversation ${conversationId}`);
        });

        // Leave a conversation room
        socket.on("leaveConversation", (conversationId) => {
            socket.leave(conversationId);
            console.log(`💬 User ${userId} left conversation ${conversationId}`);
        });

        // Send message
        socket.on("sendMessage", async (messageData) => {
            try {
                const { conversationId, receiverId, text, image } = messageData;

                // Validate required fields
                if (!receiverId) {
                    socket.emit("messageError", { error: "Missing receiverId" });
                    return;
                }

                // Save message to database
                const newMessage = new Message({
                    senderId: userId,
                    receiverId,
                    text,
                    image,
                });

                await newMessage.save();

                // Find or create conversation
                let conversation = await Conversation.findOne({
                    participants: { $all: [userId, receiverId] },
                });

                if (!conversation) {
                    conversation = new Conversation({
                        participants: [userId, receiverId],
                        unreadCount: new Map([[receiverId, 1], [userId, 0]])
                    });
                } else {
                    // Update unread count for receiver
                    const currentUnread = conversation.unreadCount.get(receiverId) || 0;
                    conversation.unreadCount.set(receiverId, currentUnread + 1);
                }

                conversation.lastMessage = newMessage._id;
                await conversation.save();

                // Populate message with user details
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate("senderId", "username fullName profilePicture")
                    .populate("receiverId", "username fullName profilePicture");

                // Emit to sender
                socket.emit("newMessage", populatedMessage);

                // Emit to receiver if online
                const receiverSocketId = userSocketMap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newMessage", populatedMessage);

                    // Create notification
                    const notification = new Notification({
                        recipient: receiverId,
                        sender: userId,
                        type: 'message',
                        message: text || "Sent an image"
                    });
                    await notification.save();

                    io.to(receiverSocketId).emit("newNotification", {
                        _id: notification._id,
                        type: "message",
                        from: userId,
                        message: text || "Sent an image",
                        createdAt: notification.createdAt
                    });
                }

                // Emit to conversation room if exists
                if (conversationId) {
                    io.to(conversationId).emit("newMessage", populatedMessage);
                }

            } catch (error) {
                console.error("❌ Error in sendMessage socket:", error);
                socket.emit("messageError", { error: error.message });
            }
        });

        // Typing indicator
        socket.on("typing", ({ conversationId, isTyping }) => {
            if (!conversationId) return;

            socket.to(conversationId).emit("typing", {
                userId,
                isTyping
            });
        });

        // Message read receipt
        socket.on("markAsRead", async ({ conversationId }) => {
            try {
                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    conversation.unreadCount.set(userId, 0);
                    await conversation.save();

                    // Notify other participants
                    const otherParticipants = conversation.participants.filter(
                        (p) => p.toString() !== userId.toString()
                    );

                    otherParticipants.forEach(participantId => {
                        const participantSocketId = userSocketMap[participantId];
                        if (participantSocketId) {
                            io.to(participantSocketId).emit("messagesRead", {
                                conversationId,
                                userId
                            });
                        }
                    });
                }
            } catch (error) {
                console.error("Error in markAsRead:", error);
            }
        });

        // ========== SOCIAL MEDIA EVENTS ==========

        // Like/Unlike post
        socket.on("toggleLikePost", async ({ postId }) => {
            try {
                console.log(`❤️  User ${userId} toggling like on post ${postId}`);

                const post = await Post.findById(postId);
                if (!post) {
                    socket.emit("postError", { error: "Post not found" });
                    return;
                }

                const isLiked = post.likes.includes(userId);

                if (isLiked) {
                    post.likes.pull(userId);
                } else {
                    post.likes.push(userId);

                    // Create notification if not liking own post
                    if (post.user.toString() !== userId.toString()) {
                        const notification = new Notification({
                            recipient: post.user,
                            sender: userId,
                            type: 'like',
                            post: postId
                        });
                        await notification.save();

                        // Notify post owner
                        const ownerSocketId = userSocketMap[post.user];
                        if (ownerSocketId) {
                            io.to(ownerSocketId).emit("newNotification", {
                                _id: notification._id,
                                type: "like",
                                from: userId,
                                postId: postId,
                                createdAt: notification.createdAt
                            });
                        }
                    }
                }

                await post.save();

                // Broadcast like update to all users
                io.emit("postLiked", {
                    postId,
                    userId,
                    isLiked: !isLiked,
                    likesCount: post.likes.length
                });

                // Also emit to post-specific room
                io.to(`post-${postId}`).emit("postLiked", {
                    postId,
                    userId,
                    isLiked: !isLiked,
                    likesCount: post.likes.length
                });

            } catch (error) {
                console.error("Error in toggleLikePost:", error);
                socket.emit("postError", { error: error.message });
            }
        });

        // New comment on post
        socket.on("newComment", async ({ postId, commentId }) => {
            try {
                // Notify post owner
                const post = await Post.findById(postId).populate('user', '_id');
                if (post && post.user._id.toString() !== userId.toString()) {
                    const ownerSocketId = userSocketMap[post.user._id];
                    if (ownerSocketId) {
                        const notification = new Notification({
                            recipient: post.user._id,
                            sender: userId,
                            type: 'comment',
                            post: postId,
                            comment: commentId
                        });
                        await notification.save();

                        io.to(ownerSocketId).emit("newNotification", {
                            _id: notification._id,
                            type: "comment",
                            from: userId,
                            postId: postId,
                            commentId: commentId,
                            createdAt: notification.createdAt
                        });
                    }
                }

                // Notify all users viewing this post
                io.emit("postCommented", {
                    postId,
                    commentId,
                    userId,
                    timestamp: new Date()
                });

                // Emit to post room
                io.to(`post-${postId}`).emit("postCommented", {
                    postId,
                    commentId,
                    userId,
                    timestamp: new Date()
                });

            } catch (error) {
                console.error("Error in newComment:", error);
            }
        });

        // Follow/Unfollow user
        socket.on("toggleFollow", async ({ userId: targetUserId }) => {
            try {
                console.log(`👤 User ${userId} toggling follow for user ${targetUserId}`);

                const currentUser = await User.findById(userId);
                const targetUser = await User.findById(targetUserId);

                if (!currentUser || !targetUser) {
                    socket.emit("followError", { error: "User not found" });
                    return;
                }

                const isFollowing = currentUser.following.includes(targetUserId);

                if (isFollowing) {
                    // Unfollow
                    currentUser.following.pull(targetUserId);
                    targetUser.followers.pull(userId);
                } else {
                    // Follow
                    currentUser.following.push(targetUserId);
                    targetUser.followers.push(userId);

                    // Create notification
                    const notification = new Notification({
                        recipient: targetUserId,
                        sender: userId,
                        type: 'follow'
                    });
                    await notification.save();

                    // Notify followed user
                    const targetSocketId = userSocketMap[targetUserId];
                    if (targetSocketId) {
                        io.to(targetSocketId).emit("newNotification", {
                            _id: notification._id,
                            type: "follow",
                            from: userId,
                            createdAt: notification.createdAt
                        });
                    }
                }

                await Promise.all([currentUser.save(), targetUser.save()]);

                // Emit follow update to both users
                socket.emit("followUpdated", {
                    followerId: userId,
                    targetUserId,
                    following: !isFollowing,
                    followersCount: targetUser.followers.length,
                    followingCount: currentUser.following.length
                });

                // Notify target user
                const targetSocketId = userSocketMap[targetUserId];
                if (targetSocketId) {
                    io.to(targetSocketId).emit("followUpdated", {
                        followerId: userId,
                        targetUserId,
                        following: !isFollowing,
                        followersCount: targetUser.followers.length,
                        followingCount: currentUser.following.length
                    });
                }

            } catch (error) {
                console.error("Error in toggleFollow:", error);
                socket.emit("followError", { error: error.message });
            }
        });

        // New post created
        socket.on("newPostCreated", async (postData) => {
            try {
                console.log(`📝 New post created by ${userId}:`, postData._id);

                // Notify followers
                const user = await User.findById(userId).select('followers');

                if (user.followers && user.followers.length > 0) {
                    user.followers.forEach(followerId => {
                        const followerSocketId = userSocketMap[followerId];
                        if (followerSocketId) {
                            const notification = new Notification({
                                recipient: followerId,
                                sender: userId,
                                type: 'post',
                                post: postData._id
                            });

                            notification.save().then(() => {
                                io.to(followerSocketId).emit("newNotification", {
                                    _id: notification._id,
                                    type: "post",
                                    from: userId,
                                    postId: postData._id,
                                    createdAt: notification.createdAt
                                });
                            }).catch(err => {
                                console.error("Error creating notification:", err);
                            });
                        }
                    });
                }

                // Broadcast to all connected users except sender
                socket.broadcast.emit("newPostCreated", {
                    ...postData,
                    user: {
                        _id: userId,
                        username: socket.username
                    }
                });

            } catch (error) {
                console.error("Error in newPostCreated:", error);
            }
        });

        // Join post room (for live reactions)
        socket.on("joinPost", (postId) => {
            socket.join(`post-${postId}`);
            console.log(`📸 User ${userId} joined post ${postId}`);
        });

        // Leave post room
        socket.on("leavePost", (postId) => {
            socket.leave(`post-${postId}`);
            console.log(`📸 User ${userId} left post ${postId}`);
        });

        // Get online users
        socket.on("getOnlineUsers", () => {
            socket.emit("onlineUsers", Object.keys(userSocketMap));
        });

        // ========== DISCONNECTION ==========

        socket.on("disconnect", (reason) => {
            console.log("❌ User disconnected:", socket.id, "Reason:", reason);

            if (userId && userSocketMap[userId]) {
                delete userSocketMap[userId];
                io.emit("onlineUsers", Object.keys(userSocketMap));

                // Update user status to offline
                User.findByIdAndUpdate(userId, {
                    status: "offline",
                    lastSeen: new Date()
                }, { new: true })
                    .then((user) => {
                        socket.broadcast.emit("userStatusChanged", {
                            userId,
                            status: "offline",
                            lastSeen: user.lastSeen,
                        });
                    })
                    .catch(error => {
                        console.error("Error updating offline status:", error);
                    });
            }
        });

        // Error handling
        socket.on("error", (error) => {
            console.error(`❌ Socket error for user ${userId}:`, error);
        });
    });

    console.log("✅ Socket handler initialized");
};