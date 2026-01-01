import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        video: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
        },
        caption: {
            type: String,
            maxlength: 2200,
            default: "",
        },
        hashtags: [String],
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
        duration: {
            type: Number,
            default: 0,
        },
        isCommentsDisabled: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes
reelSchema.index({ user: 1, createdAt: -1 });
reelSchema.index({ likes: -1 });
reelSchema.index({ createdAt: -1 });

// Virtual for likes count
reelSchema.virtual("likesCount").get(function () {
    return this.likes.length;
});

// Virtual for comments count
reelSchema.virtual("commentsCount").get(function () {
    return this.comments.length;
});

const Reel = mongoose.model("Reel", reelSchema);

export default Reel;