// routes/message.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    // Chat functions (WORKING)
    getUserForSidebar,
    getMessages,
    sendMessage,
    getConversations,
    uploadVoiceMessage,
    uploadImageMessage,
    uploadFileMessage,
    
    // Post functions (BASIC - WORKING)
    createPost,
    getFeedPosts,
    getExplorePosts,
    toggleLikePost,
    
    // Comment functions (BASIC - WORKING)
    addComment,
    getPostComments,
    
    // Notifications (WORKING)
    getNotifications,
    
    // Debug
    debugChatData
} from "../controllers/message.controller.js";
import { uploadPostMiddleware } from "../middleware/upload.middleware.js";

const router = express.Router();

// ✅ Test route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Messages API is working!",
    endpoints: {
      chat: "/chat/*",
      posts: "/posts/*",
      notifications: "/notifications"
    }
  });
});

// ========== CHAT ROUTES (WORKING) ==========
router.get("/chat/users", protectRoute, getUserForSidebar);
router.get("/chat/conversations", protectRoute, getConversations);
router.get("/chat/:id", protectRoute, getMessages);
router.post("/chat/send/:id", protectRoute, sendMessage);

// File uploads for chat
router.post("/chat/upload-voice", protectRoute, uploadVoiceMessage);
router.post("/chat/upload-image", protectRoute, uploadImageMessage);
router.post("/chat/upload-file", protectRoute, uploadFileMessage);

// ========== POST ROUTES (BASIC WORKING) ==========
router.post("/posts/create", protectRoute, uploadPostMiddleware, createPost);
router.get("/posts/feed", protectRoute, getFeedPosts);
router.get("/posts/explore", protectRoute, getExplorePosts);
router.post("/posts/:postId/like", protectRoute, toggleLikePost);

// ========== COMMENT ROUTES (BASIC WORKING) ==========
router.post("/posts/:postId/comments", protectRoute, addComment);
router.get("/posts/:postId/comments", protectRoute, getPostComments);

// ========== NOTIFICATION ROUTES (WORKING) ==========
router.get("/notifications", protectRoute, getNotifications);

// ========== DEBUG ROUTE ==========
router.get("/debug/chat-data", protectRoute, debugChatData);

export default router;