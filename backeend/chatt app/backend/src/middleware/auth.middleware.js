import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        let token = req.cookies.jwt;

        // Fallback to Authorization header for API requests
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please login to continue."
            });
        }

        // Verify JWT secret exists
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables");
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            // Handle different JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Session expired. Please login again.",
                    expired: true
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token. Please login again."
                });
            }

            throw jwtError;
        }

        // Check if token has userId
        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token structure"
            });
        }

        // Find user
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found. Please login again."
            });
        }

        // Check if user is active (optional - add status field to your User model)
        // if (user.status === 'suspended') {
        //     return res.status(403).json({ 
        //         success: false,
        //         message: "Your account has been suspended." 
        //     });
        // }

        // Update last active timestamp (optional)
        // user.lastActive = new Date();
        // await user.save();

        // Attach user to request
        req.user = user;
        req.token = token;

        next();

    } catch (error) {
        console.error("🔒 Auth middleware error:", error.message);

        // Don't expose internal errors in production
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : "Authentication failed. Please try again.";

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
};

// Optional: Admin role middleware
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required."
        });
    }
    next();
};

// Optional: Verified account middleware
export const requireVerified = (req, res, next) => {
    if (!req.user || !req.user.verified) {
        return res.status(403).json({
            success: false,
            message: "Please verify your email address to access this feature."
        });
    }
    next();
};

// Optional: Rate limiting helper (use with express-rate-limit)
export const rateLimitHandler = (req, res) => {
    return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter: req.rateLimit.resetTime
    });
};

// Optional: Logout middleware
export const logoutMiddleware = async (req, res, next) => {
    try {
        // Clear the cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            secure: process.env.NODE_ENV === "production",
            path: "/"
        });

        // Optional: Add token to blacklist (if you implement token blacklisting)
        // await TokenBlacklist.create({ token: req.token });

        next();
    } catch (error) {
        console.error("Logout middleware error:", error);
        next(); // Continue even if logout cleanup fails
    }
};

// Optional: API key middleware for external services
export const requireApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: "API key required"
        });
    }

    // Validate API key (you would store these in your database)
    const validKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

    if (!validKeys.includes(apiKey)) {
        return res.status(401).json({
            success: false,
            message: "Invalid API key"
        });
    }

    next();
};