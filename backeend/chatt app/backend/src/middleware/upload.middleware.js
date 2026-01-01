import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
    const extname = path.extname(file.originalname).toLowerCase().replace(".", "");

    if (req.route.path.includes("/posts/create")) {
        // For posts, allow both images and videos
        if (allowedImageTypes.test(extname) || allowedVideoTypes.test(extname)) {
            cb(null, true);
        } else {
            cb(new Error("Only image and video files are allowed for posts"));
        }
    } else if (req.route.path.includes("/reels/create")) {
        // For reels, only allow videos
        if (allowedVideoTypes.test(extname)) {
            cb(null, true);
        } else {
            cb(new Error("Only video files are allowed for reels"));
        }
    } else if (req.route.path.includes("/update-profile")) {
        // For profile, only allow images
        if (allowedImageTypes.test(extname)) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed for profile"));
        }
    } else {
        cb(null, true);
    }
};

// Create multer instances
const uploadProfile = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for profile
    fileFilter,
}).single("profilePicture");

const uploadPost = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for posts
    fileFilter,
}).array("media", 10); // Max 10 files

const uploadReel = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for reels
    fileFilter,
}).single("video");

// Middleware wrapper functions
export const uploadProfileMiddleware = (req, res, next) => {
    uploadProfile(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error",
            });
        }
        next();
    });
};

export const uploadPostMiddleware = (req, res, next) => {
    uploadPost(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error",
            });
        }
        next();
    });
};

export const uploadReelMiddleware = (req, res, next) => {
    uploadReel(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error",
            });
        }
        next();
    });
};