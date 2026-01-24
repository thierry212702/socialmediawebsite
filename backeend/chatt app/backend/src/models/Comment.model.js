// src/models/Comment.model.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel",
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
        replies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
        isEdited: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ reel: 1, createdAt: -1 });
commentSchema.index({ user: 1 });

// FIXED: Check if model already exists before creating
const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;