// controllers/message.controller.js - COMPLETE VERSION
import mongoose from "mongoose";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Post from "../models/Post.model.js";
import Notification from "../models/notification.model.js";
import Comment from "../models/comment.model.js";
import multer from "multer";
import fs from "fs";
import path from "path";

// ========== HELPER FUNCTIONS ==========

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = "uploads/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|avi|mov|mp3|wav|ogg|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error("File type not allowed!"));
        }
    },
});

// Helper to check if string is valid ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Helper function for message type text
const getMessageTypeText = (type) => {
    switch(type) {
        case 'image': return '📷 Image';
        case 'voice': return '🎤 Voice message';
        case 'video': return '🎥 Video';
        case 'file': return '📎 File';
        default: return 'Message';
    }
};

// ========== CHAT CONTROLLERS ==========

// Get users for sidebar
export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // Get all users except the logged-in user
        const allUsers = await User.find({
            _id: { $ne: loggedInUserId },
        }).select("-password").lean();

        // Get the last message with each user
        const usersWithChatInfo = await Promise.all(
            allUsers.map(async (user) => {
                try {
                    // Get last message between logged in user and this user
                    const lastMessage = await Message.findOne({
                        $or: [
                            { senderId: loggedInUserId, receiverId: user._id },
                            { senderId: user._id, receiverId: loggedInUserId }
                        ]
                    })
                    .sort({ createdAt: -1 })
                    .lean();

                    // Get unread message count
                    const unreadCount = await Message.countDocuments({
                        senderId: user._id,
                        receiverId: loggedInUserId,
                        read: false
                    });

                    // Get following status
                    const loggedInUser = await User.findById(loggedInUserId).select("following").lean();
                    const isFollowing = loggedInUser?.following?.includes(user._id.toString()) || false;

                    return {
                        _id: user._id.toString(),
                        username: user.username,
                        name: user.name || user.username,
                        email: user.email,
                        profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff`,
                        bio: user.bio || "",
                        lastMessage: lastMessage ? {
                            text: lastMessage.text || `${lastMessage.messageType} message`,
                            messageType: lastMessage.messageType,
                            createdAt: lastMessage.createdAt,
                            senderId: lastMessage.senderId
                        } : null,
                        unreadCount: unreadCount || 0,
                        isOnline: false,
                        isFollowing,
                        hasConversation: !!lastMessage,
                        lastActive: user.lastActive || user.updatedAt || user.createdAt
                    };
                } catch (err) {
                    console.error(`Error processing user ${user._id}:`, err);
                    return {
                        _id: user._id.toString(),
                        username: user.username,
                        name: user.name || user.username,
                        profilePicture: user.profilePicture,
                        error: "Error loading chat data"
                    };
                }
            })
        );

        // Sort users
        const sortedUsers = usersWithChatInfo.sort((a, b) => {
            if (a.lastMessage && b.lastMessage) {
                return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
            }
            if (a.lastMessage && !b.lastMessage) return -1;
            if (!a.lastMessage && b.lastMessage) return 1;
            return a.username.localeCompare(b.username);
        });

        res.status(200).json({
            success: true,
            users: sortedUsers,
            total: sortedUsers.length
        });

    } catch (error) {
        console.error("Error in getUserForSidebar:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            users: []
        });
    }
};

// Get conversations - FIXED unreadCount issue
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find conversations where user is a participant
        const conversations = await Conversation.find({
            participants: userId,
        })
        .populate({
            path: "participants",
            match: { _id: { $ne: userId } },
            select: "username profilePicture name email"
        })
        .populate({
            path: "lastMessage",
            select: "text messageType createdAt read senderId"
        })
        .sort({ updatedAt: -1 })
        .lean();

        // Filter and enhance conversations
        const enhancedConversations = await Promise.all(
            conversations.map(async (convo) => {
                try {
                    const otherUser = convo.participants?.[0];
                    if (!otherUser) return null;

                    // Get unread count - FIXED: Handle both Map and object formats
                    let unreadCount = 0;
                    if (convo.unreadCount) {
                        if (convo.unreadCount instanceof Map || convo.unreadCount.constructor.name === 'Map') {
                            unreadCount = convo.unreadCount.get(userId.toString()) || 0;
                        } else if (typeof convo.unreadCount === 'object') {
                            unreadCount = convo.unreadCount[userId.toString()] || 0;
                        }
                    }

                    // Also count unread messages from database
                    const dbUnreadCount = await Message.countDocuments({
                        senderId: otherUser._id,
                        receiverId: userId,
                        read: false
                    });

                    unreadCount = Math.max(unreadCount, dbUnreadCount);

                    return {
                        _id: convo._id.toString(),
                        user: {
                            _id: otherUser._id.toString(),
                            username: otherUser.username,
                            name: otherUser.name || otherUser.username,
                            profilePicture: otherUser.profilePicture || `https://ui-avatars.com/api/?name=${otherUser.username}`,
                            email: otherUser.email
                        },
                        lastMessage: convo.lastMessage ? {
                            text: convo.lastMessage.text || `${convo.lastMessage.messageType} message`,
                            messageType: convo.lastMessage.messageType,
                            createdAt: convo.lastMessage.createdAt,
                            read: convo.lastMessage.read,
                            isSentByMe: convo.lastMessage.senderId?.toString() === userId.toString()
                        } : null,
                        unreadCount,
                        updatedAt: convo.updatedAt,
                        createdAt: convo.createdAt
                    };
                } catch (err) {
                    console.error("Error enhancing conversation:", err);
                    return null;
                }
            })
        );

        // Filter out null values and sort
        const validConversations = enhancedConversations.filter(conv => conv !== null);
        const sortedConversations = validConversations.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.updatedAt;
            const timeB = b.lastMessage?.createdAt || b.updatedAt;
            return new Date(timeB) - new Date(timeA);
        });

        res.status(200).json({
            success: true,
            conversations: sortedConversations,
            total: sortedConversations.length
        });

    } catch (error) {
        console.error("Error in getConversations:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            conversations: []
        });
    }
};

// Get messages for a conversation - FIXED ObjectId issue
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const userId = req.user._id;

        // Validate userToChatId
        if (!isValidObjectId(userToChatId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user ID format"
            });
        }

        // Check if other user exists
        const otherUser = await User.findById(userToChatId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // Get messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: userId },
            ],
        })
            .populate("senderId", "username profilePicture name")
            .populate("receiverId", "username profilePicture name")
            .sort({ createdAt: 1 })
            .lean();

        // Mark messages as read
        if (messages.length > 0) {
            await Message.updateMany(
                {
                    senderId: userToChatId,
                    receiverId: userId,
                    read: false,
                },
                { $set: { read: true, readAt: new Date() } }
            );
        }

        // Format messages
        const formattedMessages = messages.map(msg => ({
            _id: msg._id.toString(),
            text: msg.text || getMessageTypeText(msg.messageType),
            senderId: msg.senderId?._id?.toString(),
            receiverId: msg.receiverId?._id?.toString(),
            sender: {
                _id: msg.senderId?._id?.toString(),
                username: msg.senderId?.username,
                name: msg.senderId?.name || msg.senderId?.username,
                profilePicture: msg.senderId?.profilePicture
            },
            receiver: {
                _id: msg.receiverId?._id?.toString(),
                username: msg.receiverId?.username,
                name: msg.receiverId?.name || msg.receiverId?.username,
                profilePicture: msg.receiverId?.profilePicture
            },
            messageType: msg.messageType,
            read: msg.read,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
            ...(msg.image && { image: msg.image }),
            ...(msg.voiceMessage && { voiceMessage: msg.voiceMessage }),
            ...(msg.file && { file: msg.file })
        }));

        // Get or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, userToChatId] },
        });

        if (!conversation && messages.length > 0) {
            conversation = new Conversation({
                participants: [userId, userToChatId],
                lastMessage: messages[messages.length - 1]._id,
                unreadCount: {}
            });
            conversation.unreadCount[userToChatId] = 0;
            conversation.unreadCount[userId] = 0;
            await conversation.save();
        }

        // Update conversation unread count
        if (conversation) {
            conversation.unreadCount = conversation.unreadCount || {};
            conversation.unreadCount[userId] = 0;
            conversation.updatedAt = new Date();
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            messages: formattedMessages,
            otherUser: {
                _id: otherUser._id.toString(),
                username: otherUser.username,
                name: otherUser.name || otherUser.username,
                profilePicture: otherUser.profilePicture,
                bio: otherUser.bio || "",
                isOnline: false
            },
            conversationId: conversation?._id?.toString(),
            total: formattedMessages.length
        });

    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            messages: []
        });
    }
};

// Send message
export const sendMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const { text, messageType = "text" } = req.body;
        const senderId = req.user._id;

        // Validate
        if (!receiverId || !isValidObjectId(receiverId)) {
            return res.status(400).json({ 
                success: false,
                error: "Valid receiver ID is required" 
            });
        }

        if (messageType === "text" && (!text?.trim())) {
            return res.status(400).json({ 
                success: false,
                error: "Message text is required" 
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ 
                success: false,
                error: "User not found" 
            });
        }

        // Create message
        const messageData = {
            senderId,
            receiverId,
            messageType,
            ...(messageType === "text" && { text: text.trim() })
        };

        const newMessage = new Message(messageData);
        await newMessage.save();

        // Find or create conversation - FIXED: Use object instead of Map
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, receiverId],
                unreadCount: {}
            });
            conversation.unreadCount[receiverId.toString()] = 1;
            conversation.unreadCount[senderId.toString()] = 0;
        } else {
            // Initialize unreadCount if it doesn't exist
            conversation.unreadCount = conversation.unreadCount || {};
            // Increment unread count for receiver
            const currentUnread = conversation.unreadCount[receiverId.toString()] || 0;
            conversation.unreadCount[receiverId.toString()] = currentUnread + 1;
        }

        conversation.lastMessage = newMessage._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Populate message
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "username profilePicture name")
            .populate("receiverId", "username profilePicture name");

        // Create notification
        const notification = new Notification({
            recipient: receiverId,
            sender: senderId,
            type: "message",
            message: `New message from ${req.user.username}`,
            relatedId: newMessage._id
        });
        await notification.save();

        // Format response
        const formattedMessage = {
            _id: populatedMessage._id.toString(),
            text: populatedMessage.text || getMessageTypeText(populatedMessage.messageType),
            senderId: populatedMessage.senderId._id.toString(),
            receiverId: populatedMessage.receiverId._id.toString(),
            sender: {
                _id: populatedMessage.senderId._id.toString(),
                username: populatedMessage.senderId.username,
                name: populatedMessage.senderId.name || populatedMessage.senderId.username,
                profilePicture: populatedMessage.senderId.profilePicture
            },
            receiver: {
                _id: populatedMessage.receiverId._id.toString(),
                username: populatedMessage.receiverId.username,
                name: populatedMessage.receiverId.name || populatedMessage.receiverId.username,
                profilePicture: populatedMessage.receiverId.profilePicture
            },
            messageType: populatedMessage.messageType,
            read: populatedMessage.read,
            createdAt: populatedMessage.createdAt,
            updatedAt: populatedMessage.updatedAt
        };

        // Emit socket event if socket.io is available
        if (req.app.get('io')) {
            req.app.get('io').to(receiverId.toString()).emit('newMessage', formattedMessage);
        }

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: formattedMessage,
            conversationId: conversation._id.toString()
        });

    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
};

// ========== FILE UPLOAD CONTROLLERS ==========

// Upload voice message
export const uploadVoiceMessage = async (req, res) => {
    try {
        const { receiverId, duration } = req.body;
        const voiceFile = req.file;
        const senderId = req.user._id;

        if (!voiceFile) {
            return res.status(400).json({ 
                success: false,
                error: "No voice file uploaded" 
            });
        }

        if (!receiverId || !isValidObjectId(receiverId)) {
            return res.status(400).json({ 
                success: false,
                error: "Valid receiver ID is required" 
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ 
                success: false,
                error: "User not found" 
            });
        }

        // Create message with voice
        const message = new Message({
            senderId,
            receiverId,
            messageType: "voice",
            voiceMessage: {
                url: `/uploads/${voiceFile.filename}`,
                duration: parseInt(duration) || 0,
                filename: voiceFile.filename,
            },
        });

        await message.save();

        // Update conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, receiverId],
                unreadCount: {}
            });
            conversation.unreadCount[receiverId.toString()] = 1;
            conversation.unreadCount[senderId.toString()] = 0;
        } else {
            conversation.unreadCount = conversation.unreadCount || {};
            const currentUnread = conversation.unreadCount[receiverId.toString()] || 0;
            conversation.unreadCount[receiverId.toString()] = currentUnread + 1;
        }

        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Create notification
        const notification = new Notification({
            recipient: receiverId,
            sender: senderId,
            type: "message",
            message: "Sent a voice message",
            relatedId: message._id
        });
        await notification.save();

        // Populate message
        const populatedMessage = await Message.findById(message._id)
            .populate("senderId", "username profilePicture name")
            .populate("receiverId", "username profilePicture name");

        res.status(200).json({
            success: true,
            message: "Voice message sent successfully",
            data: {
                _id: populatedMessage._id.toString(),
                messageType: "voice",
                voiceMessage: populatedMessage.voiceMessage,
                sender: populatedMessage.senderId,
                receiver: populatedMessage.receiverId,
                createdAt: populatedMessage.createdAt
            },
            conversationId: conversation._id.toString()
        });
    } catch (error) {
        console.error("Error uploading voice message:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to upload voice message" 
        });
    }
};

// Upload image message
export const uploadImageMessage = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const imageFile = req.file;
        const senderId = req.user._id;

        if (!imageFile) {
            return res.status(400).json({ 
                success: false,
                error: "No image file uploaded" 
            });
        }

        if (!receiverId || !isValidObjectId(receiverId)) {
            return res.status(400).json({ 
                success: false,
                error: "Valid receiver ID is required" 
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ 
                success: false,
                error: "User not found" 
            });
        }

        const message = new Message({
            senderId,
            receiverId,
            messageType: "image",
            image: {
                url: `/uploads/${imageFile.filename}`,
                filename: imageFile.filename,
                size: imageFile.size,
                mimetype: imageFile.mimetype
            },
        });

        await message.save();

        // Update conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, receiverId],
                unreadCount: {}
            });
            conversation.unreadCount[receiverId.toString()] = 1;
            conversation.unreadCount[senderId.toString()] = 0;
        } else {
            conversation.unreadCount = conversation.unreadCount || {};
            const currentUnread = conversation.unreadCount[receiverId.toString()] || 0;
            conversation.unreadCount[receiverId.toString()] = currentUnread + 1;
        }

        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Create notification
        const notification = new Notification({
            recipient: receiverId,
            sender: senderId,
            type: "message",
            message: "Sent an image",
            relatedId: message._id
        });
        await notification.save();

        // Populate message
        const populatedMessage = await Message.findById(message._id)
            .populate("senderId", "username profilePicture name")
            .populate("receiverId", "username profilePicture name");

        res.status(200).json({
            success: true,
            message: "Image sent successfully",
            data: {
                _id: populatedMessage._id.toString(),
                messageType: "image",
                image: populatedMessage.image,
                sender: populatedMessage.senderId,
                receiver: populatedMessage.receiverId,
                createdAt: populatedMessage.createdAt
            },
            conversationId: conversation._id.toString()
        });
    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to upload image" 
        });
    }
};

// Upload file message
export const uploadFileMessage = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const file = req.file;
        const senderId = req.user._id;

        if (!file) {
            return res.status(400).json({ 
                success: false,
                error: "No file uploaded" 
            });
        }

        if (!receiverId || !isValidObjectId(receiverId)) {
            return res.status(400).json({ 
                success: false,
                error: "Valid receiver ID is required" 
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ 
                success: false,
                error: "User not found" 
            });
        }

        // Determine file type
        let messageType = "file";
        if (file.mimetype.startsWith("video/")) {
            messageType = "video";
        } else if (file.mimetype.startsWith("audio/") && !file.mimetype.includes("voice")) {
            messageType = "audio";
        } else if (file.mimetype.startsWith("image/")) {
            messageType = "image";
        }

        const message = new Message({
            senderId,
            receiverId,
            messageType,
            file: {
                url: `/uploads/${file.filename}`,
                filename: file.filename,
                type: file.mimetype,
                size: file.size,
            },
        });

        await message.save();

        // Update conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, receiverId],
                unreadCount: {}
            });
            conversation.unreadCount[receiverId.toString()] = 1;
            conversation.unreadCount[senderId.toString()] = 0;
        } else {
            conversation.unreadCount = conversation.unreadCount || {};
            const currentUnread = conversation.unreadCount[receiverId.toString()] || 0;
            conversation.unreadCount[receiverId.toString()] = currentUnread + 1;
        }

        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Create notification
        const notification = new Notification({
            recipient: receiverId,
            sender: senderId,
            type: "message",
            message: `Sent a ${messageType}`,
            relatedId: message._id
        });
        await notification.save();

        // Populate message
        const populatedMessage = await Message.findById(message._id)
            .populate("senderId", "username profilePicture name")
            .populate("receiverId", "username profilePicture name");

        res.status(200).json({
            success: true,
            message: "File sent successfully",
            data: {
                _id: populatedMessage._id.toString(),
                messageType,
                file: populatedMessage.file,
                sender: populatedMessage.senderId,
                receiver: populatedMessage.receiverId,
                createdAt: populatedMessage.createdAt
            },
            conversationId: conversation._id.toString()
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to upload file" 
        });
    }
};

// ========== POST CONTROLLERS ==========

// Create post
export const createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const userId = req.user._id;

        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const newPost = new Post({
            user: userId,
            caption,
            image: imageUrl,
        });

        await newPost.save();

        // Populate user info
        const populatedPost = await Post.findById(newPost._id).populate(
            "user",
            "username profilePicture name"
        );

        res.status(201).json({
            success: true,
            post: populatedPost
        });
    } catch (error) {
        console.error("Error in createPost:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
};

// Get feed posts
export const getFeedPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user's following list
        const user = await User.findById(userId);
        const followingIds = [...(user.following || []), userId];

        const posts = await Post.find({ user: { $in: followingIds } })
            .populate("user", "username profilePicture name")
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    select: "username profilePicture",
                },
                options: { sort: { createdAt: -1 }, limit: 2 },
            })
            .sort({ createdAt: -1 })
            .lean();

        // Add like status for current user
        const postsWithLikeStatus = posts.map(post => ({
            ...post,
            isLiked: post.likes?.includes(userId.toString()) || false,
            likesCount: post.likes?.length || 0,
            commentsCount: post.comments?.length || 0
        }));

        res.status(200).json({
            success: true,
            posts: postsWithLikeStatus,
            total: postsWithLikeStatus.length
        });
    } catch (error) {
        console.error("Error in getFeedPosts:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            posts: []
        });
    }
};

// Get explore posts
export const getExplorePosts = async (req, res) => {
    try {
        const userId = req.user._id;

        const posts = await Post.find()
            .populate("user", "username profilePicture name")
            .sort({ likes: -1, createdAt: -1 })
            .limit(50)
            .lean();

        // Add like status for current user
        const postsWithLikeStatus = posts.map(post => ({
            ...post,
            isLiked: post.likes?.includes(userId.toString()) || false,
            likesCount: post.likes?.length || 0,
            commentsCount: post.comments?.length || 0
        }));

        res.status(200).json({
            success: true,
            posts: postsWithLikeStatus,
            total: postsWithLikeStatus.length
        });
    } catch (error) {
        console.error("Error in getExplorePosts:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            posts: []
        });
    }
};

// Toggle like post
export const toggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        if (!isValidObjectId(postId)) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid post ID" 
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ 
                success: false,
                error: "Post not found" 
            });
        }

        const isLiked = post.likes?.includes(userId.toString()) || false;

        if (isLiked) {
            // Unlike
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            // Like
            if (!post.likes) post.likes = [];
            post.likes.push(userId);
        }

        await post.save();

        // Create notification if not liking own post
        if (post.user.toString() !== userId.toString() && !isLiked) {
            const notification = new Notification({
                recipient: post.user,
                sender: userId,
                type: "like",
                post: postId,
            });
            await notification.save();
        }

        res.status(200).json({
            success: true,
            liked: !isLiked,
            likesCount: post.likes?.length || 0,
        });
    } catch (error) {
        console.error("Error in toggleLikePost:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
};

// Get user posts
export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const userId = req.user._id;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: "User not found" 
            });
        }

        const posts = await Post.find({ user: user._id })
            .populate("user", "username profilePicture name")
            .sort({ createdAt: -1 })
            .lean();

        // Add like status for current user
        const postsWithLikeStatus = posts.map(post => ({
            ...post,
            isLiked: post.likes?.includes(userId.toString()) || false,
            likesCount: post.likes?.length || 0,
            commentsCount: post.comments?.length || 0
        }));

        res.status(200).json({
            success: true,
            posts: postsWithLikeStatus,
            user: {
                _id: user._id.toString(),
                username: user.username,
                name: user.name || user.username,
                profilePicture: user.profilePicture,
                bio: user.bio,
                followers: user.followers?.length || 0,
                following: user.following?.length || 0,
                isFollowing: user.followers?.includes(userId.toString()) || false
            },
            total: postsWithLikeStatus.length
        });
    } catch (error) {
        console.error("Error in getUserPosts:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            posts: []
        });
    }
};

// ========== COMMENT CONTROLLERS ==========

// Add comment - FIXED: This was missing
export const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!isValidObjectId(postId)) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid post ID" 
            });
        }

        if (!text?.trim()) {
            return res.status(400).json({ 
                success: false,
                error: "Comment text is required" 
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ 
                success: false,
                error: "Post not found" 
            });
        }

        const comment = new Comment({
            user: userId,
            post: postId,
            text: text.trim(),
        });

        await comment.save();

        // Add comment to post
        if (!post.comments) post.comments = [];
        post.comments.push(comment._id);
        await post.save();

        // Populate comment with user info
        const populatedComment = await Comment.findById(comment._id).populate(
            "user",
            "username profilePicture name"
        );

        // Create notification if not commenting on own post
        if (post.user.toString() !== userId.toString()) {
            const notification = new Notification({
                recipient: post.user,
                sender: userId,
                type: "comment",
                post: postId,
                comment: comment._id,
            });
            await notification.save();
        }

        res.status(201).json({
            success: true,
            comment: populatedComment
        });
    } catch (error) {
        console.error("Error in addComment:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
};

// Get post comments - FIXED: This was missing
export const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!isValidObjectId(postId)) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid post ID" 
            });
        }

        const comments = await Comment.find({ post: postId })
            .populate("user", "username profilePicture name")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            comments: comments,
            total: comments.length
        });
    } catch (error) {
        console.error("Error in getPostComments:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            comments: []
        });
    }
};

// Delete comment - FIXED: This was missing
export const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const userId = req.user._id;

        if (!isValidObjectId(commentId) || !isValidObjectId(postId)) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid ID format" 
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ 
                success: false,
                error: "Comment not found" 
            });
        }

        // Check if user owns the comment
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ 
                success: false,
                error: "Not authorized to delete this comment" 
            });
        }

        // Remove comment from post
        await Post.findByIdAndUpdate(postId, {
            $pull: { comments: commentId },
        });

        // Delete comment
        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({ 
            success: true, 
            message: "Comment deleted successfully" 
        });
    } catch (error) {
        console.error("Error in deleteComment:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
};

// ========== SEARCH CONTROLLERS ==========

// Search posts - FIXED: This was missing
export const searchPosts = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user._id;

        if (!q) {
            return res.status(400).json({ 
                success: false,
                error: "Search query is required" 
            });
        }

        const posts = await Post.find({
            $or: [
                { caption: { $regex: q, $options: "i" } },
                { tags: { $regex: q, $options: "i" } }
            ],
        })
            .populate("user", "username profilePicture name")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Add like status for current user
        const postsWithLikeStatus = posts.map(post => ({
            ...post,
            isLiked: post.likes?.includes(userId.toString()) || false,
            likesCount: post.likes?.length || 0,
            commentsCount: post.comments?.length || 0
        }));

        res.status(200).json({
            success: true,
            posts: postsWithLikeStatus,
            total: postsWithLikeStatus.length,
            query: q
        });
    } catch (error) {
        console.error("Error in searchPosts:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            posts: []
        });
    }
};

// Delete post - FIXED: This was missing
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        if (!isValidObjectId(postId)) {
            return res.status(400).json({ 
                success: false,
                error: "Invalid post ID" 
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ 
                success: false,
                error: "Post not found" 
            });
        }

        // Check if user owns the post
        if (post.user.toString() !== userId.toString()) {
            return res.status(403).json({ 
                success: false,
                error: "Not authorized to delete this post" 
            });
        }

        // Delete all comments on this post
        await Comment.deleteMany({ post: postId });

        // Delete post
        await Post.findByIdAndDelete(postId);

        res.status(200).json({ 
            success: true, 
            message: "Post deleted successfully" 
        });
    } catch (error) {
        console.error("Error in deletePost:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
};

// ========== NOTIFICATION CONTROLLERS ==========

// Get notifications - FIXED: This was missing
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ recipient: userId })
            .populate("sender", "username profilePicture name")
            .populate("post")
            .populate("comment")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Mark as read if not already
        const unreadNotificationIds = notifications
            .filter(n => !n.read)
            .map(n => n._id);

        if (unreadNotificationIds.length > 0) {
            await Notification.updateMany(
                { _id: { $in: unreadNotificationIds } },
                { $set: { read: true, readAt: new Date() } }
            );
        }

        res.status(200).json({
            success: true,
            notifications: notifications,
            total: notifications.length,
            unreadCount: unreadNotificationIds.length
        });

    } catch (error) {
        console.error("Error in getNotifications:", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            notifications: []
        });
    }
};

// ========== DEBUG CONTROLLER ==========

// Debug endpoint
export const debugChatData = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const currentUser = await User.findById(userId).select("-password").lean();
        const allUsers = await User.find({}).select("username email profilePicture").lean();
        
        const userMessages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        })
        .populate("senderId", "username")
        .populate("receiverId", "username")
        .sort({ createdAt: -1 })
        .lean();

        const conversations = await Conversation.find({
            participants: userId
        })
        .populate("participants", "username")
        .lean();

        res.json({
            success: true,
            currentUser: {
                _id: currentUser._id.toString(),
                username: currentUser.username
            },
            stats: {
                totalUsers: allUsers.length,
                totalMessages: userMessages.length,
                totalConversations: conversations.length
            },
            sampleUsers: allUsers.slice(0, 5).map(u => ({
                _id: u._id.toString(),
                username: u.username,
                profilePicture: u.profilePicture || 'none'
            })),
            recentMessages: userMessages.slice(0, 5).map(m => ({
                _id: m._id.toString(),
                text: m.text?.substring(0, 50) || m.messageType,
                sender: m.senderId?.username,
                receiver: m.receiverId?.username
            }))
        });

    } catch (error) {
        console.error("Debug error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// ========== MULTER MIDDLEWARE ==========

// Middleware for handling file uploads
export const uploadMiddleware = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ 
                success: false,
                error: err.message 
            });
        }
        next();
    });
};

// Middleware for voice uploads
export const uploadVoiceMiddleware = (req, res, next) => {
    upload.single("voice")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ 
                success: false,
                error: err.message 
            });
        }
        next();
    });
};