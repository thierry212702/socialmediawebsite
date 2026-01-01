import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    // Chat functions
    getUserForSidebar,
    getMessages,
    sendMessage,
    getConversations,
    // Post functions
    createPost,
    getFeedPosts,
    toggleLikePost,
    getNotifications,
    getUserPosts,
    // NEW: Comment functions
    addComment,
    getPostComments,
    deleteComment,
    // NEW: Explore and search
    getExplorePosts,
    searchPosts,
    deletePost,
} from "../controllers/message.controller.js";
import { uploadPostMiddleware } from "../middleware/upload.middleware.js";

const router = express.Router();

// ========== CHAT ROUTES ==========
router.get("/chat/users", protectRoute, getUserForSidebar);
router.get("/chat/conversations", protectRoute, getConversations);
router.get("/chat/:id", protectRoute, getMessages);
router.post("/chat/send/:id", protectRoute, sendMessage);

// ========== POST ROUTES ==========
router.post("/posts/create", protectRoute, uploadPostMiddleware, createPost);
router.get("/posts/feed", protectRoute, getFeedPosts);
router.get("/posts/explore", protectRoute, getExplorePosts); // NEW
router.get("/posts/search", protectRoute, searchPosts); // NEW
router.post("/posts/:postId/like", protectRoute, toggleLikePost);
router.get("/posts/user/:username", protectRoute, getUserPosts);
router.delete("/posts/:postId", protectRoute, deletePost); // NEW

// ========== COMMENT ROUTES ==========
router.post("/posts/:postId/comments", protectRoute, addComment); // NEW
router.get("/posts/:postId/comments", protectRoute, getPostComments); // NEW
router.delete("/posts/:postId/comments/:commentId", protectRoute, deleteComment); // NEW

// ========== NOTIFICATION ROUTES ==========
router.get("/notifications", protectRoute, getNotifications);
router.put("/notifications/:notificationId/read", protectRoute, (req, res) => { // NEW
    // Add markAsRead function in controller
    res.json({ success: true, message: "Notification marked as read" });
});
router.put("/notifications/read-all", protectRoute, (req, res) => { // NEW
    // Add markAllAsRead function in controller
    res.json({ success: true, message: "All notifications marked as read" });
});

export default router;