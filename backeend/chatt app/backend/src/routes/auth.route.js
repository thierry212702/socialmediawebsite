import express from "express";
import {
    signup,
    login,
    logout,
     getCurrentUser,
    updateProfile,
    checkAuth,
    changePassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { uploadProfileMiddleware } from "../middleware/upload.middleware.js";

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);

// ========== PROTECTED ROUTES ==========
router.post("/logout", protectRoute, logout);
router.get('/me', protectRoute, getCurrentUser);
router.put("/update-profile", protectRoute, uploadProfileMiddleware, updateProfile);
router.get("/check", protectRoute, checkAuth);
router.post("/change-password", protectRoute, changePassword);

export default router;