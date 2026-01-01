import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    searchUsers,
    getUserProfile,
    getUserByUsername, // NEW
    updateUserStatus,
    getFollowers,
    getFollowing,
    toggleSavePost,
    toggleSaveReel,
    getSavedContent,
    updateUserSettings,
    followUser, // NEW
    unfollowUser, // NEW
    getSuggestedUsers, // NEW
} from "../controllers/user.controller.js";

const router = express.Router();

// ========== SEARCH & PROFILE ROUTES ==========
router.get("/search", protectRoute, searchUsers);
router.get("/profile/:userId", protectRoute, getUserProfile);
router.get("/username/:username", protectRoute, getUserByUsername); // NEW
router.get("/suggested", protectRoute, getSuggestedUsers); // NEW

// ========== FOLLOW SYSTEM ROUTES ==========
router.get("/:userId/followers", protectRoute, getFollowers);
router.get("/:userId/following", protectRoute, getFollowing);
router.post("/follow/:userId", protectRoute, followUser); // NEW
router.delete("/unfollow/:userId", protectRoute, unfollowUser); // NEW

// ========== SAVE/UNSAVE CONTENT ROUTES ==========
router.post("/save/post/:postId", protectRoute, toggleSavePost);
router.post("/save/reel/:reelId", protectRoute, toggleSaveReel);
router.get("/saved", protectRoute, getSavedContent);

// ========== USER SETTINGS & STATUS ROUTES ==========
router.put("/status", protectRoute, updateUserStatus);
router.put("/settings", protectRoute, updateUserSettings);

export default router;