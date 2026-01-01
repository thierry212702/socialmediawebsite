import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {  // Fixed: receiveId → receiverId
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        // Optional: Add these fields for better functionality
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent'
        },
        deleted: {
            type: Boolean,
            default: false
        },
        deletedBy: [{  // Track who deleted the message
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    { timestamps: true }
);

// Optional: Add index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;