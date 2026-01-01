import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        // Basic Auth Fields (your existing fields)
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        profilePic: {
            type: String,
            default: "",
        },

        // ========== SOCIAL MEDIA FIELDS ==========

        // Username (required for social media)
        username: {
            type: String,
            unique: true,
            sparse: true, // Allows null/undefined for existing users
            trim: true,
            minlength: 3,
            maxlength: 30
        },

        // Profile Info
        bio: {
            type: String,
            maxlength: 150,
            default: ""
        },
        website: {
            type: String,
            default: ""
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer-not-to-say'],
            default: 'prefer-not-to-say'
        },
        location: {
            type: String,
            default: ""
        },

        // Social Connections
        followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        following: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        // Content
        posts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }],
        reels: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel"
        }],

        // Saved Content
        savedPosts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }],
        savedReels: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel"
        }],

        // Account Settings
        private: {
            type: Boolean,
            default: false
        },
        verified: {
            type: Boolean,
            default: false
        },

        // Online Status
        status: {
            type: String,
            enum: ['online', 'offline', 'away'],
            default: 'offline'
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },

        // Notification Settings
        emailNotifications: {
            type: Boolean,
            default: true
        },
        pushNotifications: {
            type: Boolean,
            default: true
        },

        // Security/Preferences
        showActivityStatus: {
            type: Boolean,
            default: true
        },
        allowTagging: {
            type: Boolean,
            default: true
        },
        allowComments: {
            type: Boolean,
            default: true
        }

    },
    { timestamps: true }
);

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ followers: -1 }); // For suggested users

// Virtual for follower/following counts
userSchema.virtual('followersCount').get(function () {
    return this.followers.length;
});

userSchema.virtual('followingCount').get(function () {
    return this.following.length;
});

userSchema.virtual('postsCount').get(function () {
    return this.posts.length;
});

userSchema.virtual('reelsCount').get(function () {
    return this.reels.length;
});

// Method to check if user follows another user
userSchema.methods.isFollowing = function (userId) {
    return this.following.includes(userId);
};

// Method to check if user is followed by another user
userSchema.methods.isFollowedBy = function (userId) {
    return this.followers.includes(userId);
};

const User = mongoose.model("User", userSchema);

export default User;