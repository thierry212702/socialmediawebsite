import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Post from "../models/Post.model.js";
import Notification from "../models/Notification.model.js";
import Call from "../models/call.model.js"; // Fixed duplicate import
import jwt from "jsonwebtoken";

export const socketHandler = (io) => {
    const userSocketMap = {}; // userId: socketId
    const userCallStatus = {}; // userId: callStatus

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

        // Join user's personal room
        socket.join(`user-${userId}`);

        // ========== ENHANCED CHAT EVENTS ==========

        // Join a conversation room (using receiverId as room name)
        socket.on("joinConversation", (receiverId) => {
            socket.join(`chat-${receiverId}`);
            console.log(`💬 User ${userId} joined chat with ${receiverId}`);
        });

        // Leave a conversation room
        socket.on("leaveConversation", (receiverId) => {
            socket.leave(`chat-${receiverId}`);
            console.log(`💬 User ${userId} left chat with ${receiverId}`);
        });

        // Send message - ENHANCED with voice and image support
        socket.on("sendMessage", async (messageData) => {
            try {
                const { receiverId, text, image, voiceMessage, messageType = 'text' } = messageData;

                console.log(`📨 User ${userId} sending ${messageType} message to ${receiverId}`);

                // Validate required fields
                if (!receiverId) {
                    socket.emit("messageError", { error: "Missing receiverId" });
                    return;
                }

                // Save message to database
                const messageObj = {
                    senderId: userId,
                    receiverId,
                    messageType,
                    text: text || '',
                    ...(image && { image }),
                    ...(voiceMessage && { voiceMessage })
                };

                const newMessage = new Message(messageObj);
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

                console.log("✅ Message saved:", populatedMessage._id);

                // EMIT TO BOTH USERS
                
                // 1. Emit to sender
                socket.emit("newMessage", populatedMessage);

                // 2. Emit to receiver if online
                const receiverSocketId = userSocketMap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newMessage", populatedMessage);
                    
                    // Create notification
                    let notificationMessage = "";
                    switch(messageType) {
                        case 'voice':
                            notificationMessage = "Sent a voice message";
                            break;
                        case 'image':
                            notificationMessage = "Sent an image";
                            break;
                        default:
                            notificationMessage = text || "Sent a message";
                    }

                    const notification = new Notification({
                        recipient: receiverId,
                        sender: userId,
                        type: 'message',
                        message: notificationMessage
                    });
                    await notification.save();

                    io.to(receiverSocketId).emit("newNotification", {
                        _id: notification._id,
                        type: "message",
                        from: userId,
                        message: notificationMessage,
                        createdAt: notification.createdAt
                    });
                }

                // 3. Emit to conversation room
                io.to(`chat-${receiverId}`).emit("newMessage", populatedMessage);

            } catch (error) {
                console.error("❌ Error in sendMessage socket:", error);
                socket.emit("messageError", { error: error.message });
            }
        });

        // Typing indicator
        socket.on("typing", ({ receiverId, isTyping }) => {
            if (!receiverId) return;

            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("typing", {
                    senderId: userId,
                    isTyping
                });
            }
        });

        // Message read receipt
        socket.on("markAsRead", async ({ conversationId, messageIds }) => {
            try {
                // Mark messages as read
                await Message.updateMany(
                    { 
                        _id: { $in: messageIds },
                        receiverId: userId 
                    },
                    { 
                        $set: { 
                            read: true, 
                            readAt: new Date() 
                        } 
                    }
                );

                // Update conversation unread count
                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    conversation.unreadCount.set(userId, 0);
                    await conversation.save();

                    // Notify sender
                    const otherParticipants = conversation.participants.filter(
                        (p) => p.toString() !== userId.toString()
                    );

                    otherParticipants.forEach(participantId => {
                        const participantSocketId = userSocketMap[participantId];
                        if (participantSocketId) {
                            io.to(participantSocketId).emit("messagesRead", {
                                conversationId,
                                readerId: userId,
                                messageIds
                            });
                        }
                    });
                }
            } catch (error) {
                console.error("Error in markAsRead:", error);
            }
        });

        // ========== VOICE MESSAGE & FILE UPLOAD ==========

        socket.on("uploadVoiceMessage", async (data) => {
            try {
                const { receiverId, voiceUrl, duration, publicId } = data;

                const message = new Message({
                    senderId: userId,
                    receiverId,
                    messageType: 'voice',
                    voiceMessage: {
                        url: voiceUrl,
                        duration,
                        publicId
                    }
                });

                await message.save();

                const populatedMessage = await Message.findById(message._id)
                    .populate("senderId", "username profilePicture");

                // Emit to both users
                socket.emit("newMessage", populatedMessage);
                
                const receiverSocketId = userSocketMap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newMessage", populatedMessage);
                }

            } catch (error) {
                console.error("❌ Error uploading voice message:", error);
                socket.emit("uploadError", { error: error.message });
            }
        });

        socket.on("uploadImage", async (data) => {
            try {
                const { receiverId, imageUrl, publicId } = data;

                const message = new Message({
                    senderId: userId,
                    receiverId,
                    messageType: 'image',
                    image: {
                        url: imageUrl,
                        publicId
                    }
                });

                await message.save();

                const populatedMessage = await Message.findById(message._id)
                    .populate("senderId", "username profilePicture");

                // Emit to both users
                socket.emit("newMessage", populatedMessage);
                
                const receiverSocketId = userSocketMap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newMessage", populatedMessage);
                }

            } catch (error) {
                console.error("❌ Error uploading image:", error);
                socket.emit("uploadError", { error: error.message });
            }
        });

        // ========== CALL EVENTS ==========

        // Initiate a call
        socket.on("initiateCall", async (data) => {
            try {
                const { receiverId, type } = data;

                console.log(`📞 User ${userId} initiating ${type} call to ${receiverId}`);

                // Check if receiver is already in a call
                if (userCallStatus[receiverId]) {
                    socket.emit("callError", { error: "User is already in a call" });
                    return;
                }

                // Create call record
                const call = new Call({
                    callerId: userId,
                    receiverId,
                    type,
                    status: 'ringing',
                    callLog: [{
                        event: 'call_initiated',
                        timestamp: new Date()
                    }]
                });

                await call.save();

                // Update call status
                userCallStatus[userId] = { inCall: true, callId: call._id };

                // Populate call data
                const populatedCall = await Call.findById(call._id)
                    .populate("callerId", "username fullName profilePicture")
                    .populate("receiverId", "username fullName profilePicture");

                // Notify receiver
                const receiverSocketId = userSocketMap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("incomingCall", {
                        call: populatedCall,
                        callerId: userId,
                        callerName: socket.username,
                        type
                    });
                } else {
                    // Receiver is offline, mark as missed
                    call.status = 'missed';
                    call.endedAt = new Date();
                    await call.save();
                    
                    // Create missed call message
                    const message = new Message({
                        senderId: userId,
                        receiverId,
                        messageType: 'system',
                        text: `Missed ${type} call`,
                        callData: {
                            type,
                            status: 'missed',
                            duration: 0
                        }
                    });
                    await message.save();
                }

                // Send confirmation to caller
                socket.emit("callInitiated", {
                    callId: call._id,
                    status: 'ringing'
                });

            } catch (error) {
                console.error("❌ Error initiating call:", error);
                socket.emit("callError", { error: error.message });
            }
        });

        // Answer a call
        socket.on("answerCall", async ({ callId }) => {
            try {
                const call = await Call.findById(callId);
                if (!call) {
                    socket.emit("callError", { error: "Call not found" });
                    return;
                }

                call.status = 'answered';
                call.startedAt = new Date();
                call.callLog.push({
                    event: 'call_answered',
                    timestamp: new Date()
                });

                await call.save();

                // Update call status for both users
                userCallStatus[userId] = { inCall: true, callId: call._id };
                userCallStatus[call.callerId] = { inCall: true, callId: call._id };

                // Notify caller
                const callerSocketId = userSocketMap[call.callerId];
                if (callerSocketId) {
                    io.to(callerSocketId).emit("callAnswered", {
                        callId: call._id,
                        receiverId: userId
                    });
                }

                // Notify both parties to start WebRTC
                socket.emit("callConnected", {
                    callId: call._id,
                    type: call.type
                });

                if (callerSocketId) {
                    io.to(callerSocketId).emit("callConnected", {
                        callId: call._id,
                        type: call.type
                    });
                }

            } catch (error) {
                console.error("❌ Error answering call:", error);
                socket.emit("callError", { error: error.message });
            }
        });

        // Decline a call
        socket.on("declineCall", async ({ callId }) => {
            try {
                const call = await Call.findById(callId);
                if (!call) return;

                call.status = 'declined';
                call.endedAt = new Date();
                call.callLog.push({
                    event: 'call_declined',
                    timestamp: new Date()
                });

                await call.save();

                // Create declined call message
                const message = new Message({
                    senderId: userId,
                    receiverId: call.callerId,
                    messageType: 'system',
                    text: `${socket.username} declined your ${call.type} call`,
                    callData: {
                        type: call.type,
                        status: 'declined',
                        duration: 0
                    }
                });

                await message.save();

                // Notify caller
                const callerSocketId = userSocketMap[call.callerId];
                if (callerSocketId) {
                    io.to(callerSocketId).emit("callDeclined", {
                        callId: call._id,
                        declinedBy: userId
                    });

                    // Send declined call message
                    const populatedMessage = await Message.findById(message._id)
                        .populate("senderId", "username profilePicture");

                    io.to(callerSocketId).emit("newMessage", populatedMessage);
                }

            } catch (error) {
                console.error("❌ Error declining call:", error);
            }
        });

        // End a call
        socket.on("endCall", async ({ callId }) => {
            try {
                const call = await Call.findById(callId);
                if (!call) return;

                // Calculate duration
                if (call.startedAt) {
                    const now = new Date();
                    call.duration = Math.floor((now - call.startedAt) / 1000);
                    call.endedAt = now;
                }

                call.status = 'ended';
                call.callLog.push({
                    event: 'call_ended',
                    timestamp: new Date()
                });

                await call.save();

                // Clear call status for both users
                delete userCallStatus[userId];
                delete userCallStatus[call.callerId];
                delete userCallStatus[call.receiverId];

                // Create call end message if call was answered
                if (call.duration > 0) {
                    const otherUserId = call.callerId.toString() === userId ? 
                        call.receiverId : call.callerId;

                    const message = new Message({
                        senderId: userId,
                        receiverId: otherUserId,
                        messageType: 'system',
                        text: `${call.type} call ended - Duration: ${formatDuration(call.duration)}`,
                        callData: {
                            type: call.type,
                            status: 'answered',
                            duration: call.duration,
                            startedAt: call.startedAt,
                            endedAt: call.endedAt
                        }
                    });

                    await message.save();

                    const otherUserSocketId = userSocketMap[otherUserId];
                    if (otherUserSocketId) {
                        const populatedMessage = await Message.findById(message._id)
                            .populate("senderId", "username profilePicture");

                        io.to(otherUserSocketId).emit("newMessage", populatedMessage);
                    }
                }

                // Notify both parties
                [call.callerId.toString(), call.receiverId.toString()].forEach(participantId => {
                    const participantSocketId = userSocketMap[participantId];
                    if (participantSocketId) {
                        io.to(participantSocketId).emit("callEnded", {
                            callId: call._id,
                            duration: call.duration
                        });
                    }
                });

            } catch (error) {
                console.error("❌ Error ending call:", error);
            }
        });

        // WebRTC signaling events
        socket.on("webrtc-signal", (data) => {
            const { callId, signal, targetUserId } = data;
            const targetSocketId = userSocketMap[targetUserId];
            if (targetSocketId) {
                io.to(targetSocketId).emit("webrtc-signal", {
                    callId,
                    signal,
                    fromUserId: userId
                });
            }
        });

        socket.on("webrtc-ice-candidate", (data) => {
            const { callId, candidate, targetUserId } = data;
            const targetSocketId = userSocketMap[targetUserId];
            if (targetSocketId) {
                io.to(targetSocketId).emit("webrtc-ice-candidate", {
                    callId,
                    candidate,
                    fromUserId: userId
                });
            }
        });

        // ========== SOCIAL MEDIA EVENTS (keep existing) ==========
        // ... [Keep all your existing social media events here]
        // ========== DISCONNECTION ==========

        socket.on("disconnect", (reason) => {
            console.log("❌ User disconnected:", socket.id, "Reason:", reason);

            if (userId && userSocketMap[userId]) {
                delete userSocketMap[userId];
                delete userCallStatus[userId];
                
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

    // Helper function
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    console.log("✅ Enhanced Socket handler initialized with call support");
};