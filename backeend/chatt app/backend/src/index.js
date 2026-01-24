import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Database and Socket
import { connectDB } from "./lib/db.js";

// Routes
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";

// Socket handler
import { socketHandler } from "./socket/socket.js";

// Initialize
dotenv.config();
const app = express();
const server = http.createServer(app);

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Socket.io configuration
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Cache-Control"]
    },
    transports: ["websocket", "polling"],
});

const PORT = process.env.PORT || 5001;

// ========== MIDDLEWARE ==========
// ✅ UPDATED CORS CONFIGURATION - FIXED!
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, Postman)
            if (!origin) {
                return callback(null, true);
            }
            
            // Allow ALL localhost ports
            if (origin.startsWith('http://localhost:') || 
                origin.startsWith('https://localhost:') ||
                origin.startsWith('http://127.0.0.1:') ||
                origin.includes('://localhost')) {
                return callback(null, true);
            }
            
            // In development, you can also allow all origins (temporarily)
            if (process.env.NODE_ENV === 'development') {
                return callback(null, true); // Allow all in dev
            }
            
            // In production, restrict to your domain
            const allowedOrigins = process.env.CLIENT_URL ? 
                process.env.CLIENT_URL.split(',') : [];
                
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log('❌ Blocked by CORS:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
            "Content-Type", 
            "Authorization", 
            "Cookie", 
            "X-Requested-With", 
            "Cache-Control",  // ✅ ADDED THIS
            "Accept",
            "Origin",
            "x-auth-token",
            "user-agent",
            "host",
            "connection",
            "upgrade",
            "pragma",
            "cache-control",
            "sec-fetch-dest",
            "sec-fetch-mode",
            "sec-fetch-site"
        ],
        exposedHeaders: ["Set-Cookie", "Authorization", "Content-Length", "X-Request-Id"],
        maxAge: 86400,
        preflightContinue: false,
        optionsSuccessStatus: 204
    })
);

// ✅ Explicitly handle OPTIONS requests
app.options('*', cors());

// Body parsers
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

// Serve static files (for uploaded images/videos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== ROUTES ==========
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// ========== SOCKET.IO ==========
socketHandler(io);

// ========== HEALTH & INFO ENDPOINTS ==========
app.get("/", (req, res) => {
    res.json({
        message: "Chat & Social Media API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            messages: "/api/messages",
            users: "/api/users",
        },
        documentation: "API Documentation",
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        cors: {
            origin: req.headers.origin || "No origin header",
            allowed: true
        }
    });
});

// ========== CORS TEST ENDPOINTS ==========
app.get("/api/cors-test", (req, res) => {
    res.json({
        success: true,
        message: "CORS is working!",
        timestamp: new Date().toISOString(),
        headers: req.headers,
        origin: req.headers.origin
    });
});

// ========== 404 HANDLER ==========
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        method: req.method,
        allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    });
});

// ========== ERROR HANDLING ==========
// Global error handler
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.message);
    console.error("Stack:", err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "development" ? message : "Something went wrong!",
        ...(process.env.NODE_ENV === "development" && { 
            stack: err.stack,
            path: req.path,
            method: req.method 
        }),
    });
});

// ========== START SERVER ==========
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 Server running on PORT: ${PORT}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🔄 CORS Test: http://localhost:${PORT}/api/cors-test`);
            console.log(`💬 Socket.io connected`);
            console.log(`🔧 CORS configured for all localhost origins`);

            if (process.env.NODE_ENV === "development") {
                console.log(`📁 Uploads folder: http://localhost:${PORT}/uploads`);
                console.log(`⚠️  CORS is in development mode - allowing all origins`);
            }
        });

        // Handle graceful shutdown
        process.on("SIGTERM", () => {
            console.log("SIGTERM received. Shutting down gracefully...");
            server.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
        });

        process.on("SIGINT", () => {
            console.log("SIGINT received. Shutting down gracefully...");
            server.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Start the server
startServer();

export { io };