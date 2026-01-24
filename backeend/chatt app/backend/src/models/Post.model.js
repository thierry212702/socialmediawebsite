// src/models/Post.model.js - UPDATED
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        caption: {
            type: String,
            maxlength: 2200,
            default: "",
        },
        media: [
            {
                type: String,
                required: true,
            },
        ],
        mediaType: {
            type: String,
            enum: ["image", "video", "carousel"],
            default: "image",
        },
        location: {
            type: String,
            default: "",
        },
        tags: [String],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
        saves: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        views: {
            type: Number,
            default: 0,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        isCommentsDisabled: {
            type: Boolean,
            default: false,
        },
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ likes: -1 });
postSchema.index({ createdAt: -1 });

// Virtual for likes count
postSchema.virtual("likesCount").get(function () {
    return this.likes.length;
});

// Virtual for comments count
postSchema.virtual("commentsCount").get(function () {
    return this.comments.length;
});

// Virtual for saves count
postSchema.virtual("savesCount").get(function () {
    return this.saves.length;
});

// FIXED LINE 80: Check if model already exists
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;