import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        // Validate MongoDB URI
        if (!process.env.MONGODB_URI) {
            console.error("❌ MONGODB_URI is not defined in environment variables");
            console.error("Please add MONGODB_URI to your .env file");
            process.exit(1); // Exit the process if no DB connection
        }

        console.log("🔗 Connecting to MongoDB...");

        // Connection options for better performance and stability
        const options = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`👤 Port: ${conn.connection.port}`);

        // Monitor connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        mongoose.connection.on('reconnectFailed', () => {
            console.error('❌ MongoDB reconnect failed');
        });

        return conn;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        console.error("Full error:", error);

        // Provide helpful error messages
        if (error.name === 'MongoParseError') {
            console.error("\n🔍 Possible issues:");
            console.error("1. Check your MONGODB_URI format");
            console.error("2. Verify your username/password");
            console.error("3. Check if special characters need URL encoding");
        } else if (error.name === 'MongooseServerSelectionError') {
            console.error("\n🔍 Possible issues:");
            console.error("1. Network connectivity issues");
            console.error("2. MongoDB server is down");
            console.error("3. Firewall blocking connection");
            console.error("4. IP not whitelisted in MongoDB Atlas");
        }

        // Exit process with failure code
        process.exit(1);
    }
};

// Graceful shutdown handler
export const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('✅ MongoDB connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
    }
};

// Handle application termination
process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
});

// Check connection status
export const checkDBStatus = () => {
    const states = [
        'disconnected',
        'connected',
        'connecting',
        'disconnecting'
    ];

    return {
        status: states[mongoose.connection.readyState],
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port
    };
};