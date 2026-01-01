import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "follow",
                "like",
                "comment",
                "message",
                "post",
                "reel",
                "mention",
                "share",
            ],
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel",
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
        message: String,
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ sender: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;