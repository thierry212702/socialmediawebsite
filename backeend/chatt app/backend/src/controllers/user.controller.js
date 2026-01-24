// controllers/user.controller.js - COMPLETE UPDATED VERSION
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Post from "../models/Post.model.js";
import Reel from "../models/Reel.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcrypt";

// ========== SEARCH & PROFILE CONTROLLERS ==========

export const searchUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const loggedInUserId = req.user._id;

        if (!search || search.trim() === '') {
            return res.status(200).json({
                success: true,
                users: []
            });
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: loggedInUserId } },
                {
                    $or: [
                        { username: { $regex: search, $options: "i" } },
                        { fullName: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                    ],
                },
            ],
        })
            .select("username fullName email profilePicture verified followers following")
            .limit(20);

        // Format response with additional info
        const formattedUsers = users.map(user => ({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            profilePicture: user.profilePicture,
            isVerified: user.verified,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            isFollowing: user.followers.includes(loggedInUserId),
            hasFollowedYou: user.following.includes(loggedInUserId)
        }));

        res.status(200).json({
            success: true,
            users: formattedUsers,
            total: formattedUsers.length
        });
    } catch (error) {
        console.error("Error in searchUsers:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Check if userId is "me" to get current user's profile
        const targetUserId = userId === "me" ? currentUserId : userId;

        const user = await User.findById(targetUserId)
            .select("-password")
            .populate('followers', 'username fullName profilePicture')
            .populate('following', 'username fullName profilePicture');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if there's a conversation between users
        const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] },
        });

        // Get user stats
        const postsCount = await Post.countDocuments({
            user: targetUserId,
            isArchived: false
        });
        const reelsCount = await Reel.countDocuments({ user: targetUserId });

        // Check if current user follows this user
        const isFollowing = user.followers.some(follower =>
            follower._id.toString() === currentUserId.toString()
        );

        // Check if this user follows current user
        const hasFollowedYou = user.following.some(following =>
            following._id.toString() === currentUserId.toString()
        );

        // Get recent posts (3 most recent)
        const recentPosts = await Post.find({
            user: targetUserId,
            isArchived: false
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('media mediaType likes comments');

        // Get recent reels (3 most recent)
        const recentReels = await Reel.find({
            user: targetUserId
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('thumbnail caption likes comments');

        const profileData = {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            website: user.website,
            gender: user.gender,
            location: user.location,
            isPrivate: user.private,
            isVerified: user.verified,
            status: user.status,
            lastSeen: user.lastSeen,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            postsCount,
            reelsCount,
            isFollowing,
            hasFollowedYou,
            conversationId: conversation?._id || null,
            canMessage: !user.private || isFollowing || targetUserId === currentUserId,
            recentPosts: recentPosts.map(post => ({
                _id: post._id,
                media: post.media[0], // First image/video
                mediaType: post.mediaType,
                likesCount: post.likes.length,
                commentsCount: post.comments.length
            })),
            recentReels: recentReels.map(reel => ({
                _id: reel._id,
                thumbnail: reel.thumbnail,
                caption: reel.caption,
                likesCount: reel.likes.length,
                commentsCount: reel.comments.length
            }))
        };

        res.status(200).json({
            success: true,
            profile: profileData
        });
    } catch (error) {
        console.error("Error in getUserProfile:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user._id;

        const user = await User.findOne({ username })
            .select("-password")
            .populate('followers', 'username fullName profilePicture')
            .populate('following', 'username fullName profilePicture');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if there's a conversation between users
        const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, user._id] },
        });

        // Get user stats
        const postsCount = await Post.countDocuments({
            user: user._id,
            isArchived: false
        });
        const reelsCount = await Reel.countDocuments({ user: user._id });

        // Check if current user follows this user
        const isFollowing = user.followers.some(follower =>
            follower._id.toString() === currentUserId.toString()
        );

        // Check if this user follows current user
        const hasFollowedYou = user.following.some(following =>
            following._id.toString() === currentUserId.toString()
        );

        const profileData = {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            website: user.website,
            gender: user.gender,
            location: user.location,
            isPrivate: user.private,
            isVerified: user.verified,
            status: user.status,
            lastSeen: user.lastSeen,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            postsCount,
            reelsCount,
            isFollowing,
            hasFollowedYou,
            conversationId: conversation?._id || null,
            canMessage: !user.private || isFollowing || user._id.toString() === currentUserId.toString(),
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            user: profileData
        });
    } catch (error) {
        console.error("Error in getUserByUsername:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ========== FOLLOW/UNFOLLOW CONTROLLERS ==========

export const followUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Cannot follow yourself
        if (userId === currentUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(userId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if already following
        if (currentUser.following.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "Already following this user"
            });
        }

        // Add to following/followers
        currentUser.following.push(userId);
        targetUser.followers.push(currentUserId);

        await Promise.all([currentUser.save(), targetUser.save()]);

        // Create notification
        await Notification.create({
            recipient: userId,
            sender: currentUserId,
            type: "follow"
        });

        res.status(200).json({
            success: true,
            message: "Successfully followed user",
            following: true,
            followersCount: targetUser.followers.length,
            followingCount: currentUser.following.length
        });
    } catch (error) {
        console.error("Error in followUser:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(userId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if not following
        if (!currentUser.following.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "Not following this user"
            });
        }

        // Remove from following/followers
        currentUser.following.pull(userId);
        targetUser.followers.pull(currentUserId);

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.status(200).json({
            success: true,
            message: "Successfully unfollowed user",
            following: false,
            followersCount: targetUser.followers.length,
            followingCount: currentUser.following.length
        });
    } catch (error) {
        console.error("Error in unfollowUser:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const user = await User.findById(userId)
            .populate({
                path: 'followers',
                select: 'username fullName profilePicture verified bio',
                options: { limit: 50 }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if current user can view followers (if profile is private)
        const isFollowing = user.followers.some(follower =>
            follower._id.toString() === currentUserId.toString()
        );

        if (user.private && !isFollowing && userId !== currentUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: "This profile is private. Follow to see their followers."
            });
        }

        // Format followers with additional info
        const formattedFollowers = user.followers.map(follower => ({
            _id: follower._id,
            username: follower.username,
            fullName: follower.fullName,
            profilePicture: follower.profilePicture,
            isVerified: follower.verified,
            bio: follower.bio,
            isFollowing: follower.followers.includes(currentUserId),
            hasFollowedYou: follower.following.includes(currentUserId)
        }));

        res.status(200).json({
            success: true,
            followers: formattedFollowers,
            total: user.followers.length,
            isPrivate: user.private
        });
    } catch (error) {
        console.error("Error in getFollowers:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const user = await User.findById(userId)
            .populate({
                path: 'following',
                select: 'username fullName profilePicture verified bio',
                options: { limit: 50 }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if current user can view following (if profile is private)
        const isFollowing = user.followers.some(follower =>
            follower._id.toString() === currentUserId.toString()
        );

        if (user.private && !isFollowing && userId !== currentUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: "This profile is private. Follow to see who they follow."
            });
        }

        // Format following with additional info
        const formattedFollowing = user.following.map(followingUser => ({
            _id: followingUser._id,
            username: followingUser.username,
            fullName: followingUser.fullName,
            profilePicture: followingUser.profilePicture,
            isVerified: followingUser.verified,
            bio: followingUser.bio,
            isFollowing: followingUser.followers.includes(currentUserId),
            hasFollowedYou: followingUser.following.includes(currentUserId)
        }));

        res.status(200).json({
            success: true,
            following: formattedFollowing,
            total: user.following.length,
            isPrivate: user.private
        });
    } catch (error) {
        console.error("Error in getFollowing:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ========== SUGGESTED USERS CONTROLLERS ==========

export const getSuggestedUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Get users that current user doesn't follow, excluding self
        const suggestedUsers = await User.find({
            _id: { $ne: currentUserId },
            followers: { $ne: currentUserId }
        })
            .select("username fullName profilePicture verified bio followers")
            .sort({ followers: -1 }) // Most popular first
            .limit(10);

        const formattedUsers = suggestedUsers.map(user => ({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            profilePicture: user.profilePicture,
            isVerified: user.verified,
            bio: user.bio,
            followersCount: user.followers.length,
            isFollowing: false
        }));

        res.status(200).json({
            success: true,
            users: formattedUsers
        });
    } catch (error) {
        console.error("Error in getSuggestedUsers:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const getSuggestedMessagingUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const currentUser = await User.findById(currentUserId);

        // Get users you follow
        const followingUsers = await User.find({
            _id: { $in: currentUser.following }
        }).select("username fullName profilePicture verified bio followers");

        // Get conversations to find users you've already messaged
        const conversations = await Conversation.find({
            participants: currentUserId
        });

        const messagedUserIds = conversations.flatMap(conv => 
            conv.participants.map(p => p.toString())
        ).filter(id => id !== currentUserId.toString());

        // Filter out users you've already messaged
        const suggestedUsers = followingUsers.filter(
            user => !messagedUserIds.includes(user._id.toString())
        );

        const formattedUsers = suggestedUsers.map(user => ({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            profilePicture: user.profilePicture,
            isVerified: user.verified,
            bio: user.bio,
            followersCount: user.followers.length,
            isFollowing: true, // Since they're in your following list
            hasFollowedYou: user.followers.includes(currentUserId),
            canMessage: true
        }));

        res.status(200).json({
            success: true,
            users: formattedUsers,
            total: formattedUsers.length
        });
    } catch (error) {
        console.error("Error in getSuggestedMessagingUsers:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const getMessagedUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Get all conversations
        const conversations = await Conversation.find({
            participants: currentUserId
        })
        .populate({
            path: 'participants',
            select: 'username fullName profilePicture verified status lastSeen',
            match: { _id: { $ne: currentUserId } }
        })
        .populate({
            path: 'lastMessage',
            select: 'text messageType createdAt read senderId'
        })
        .sort({ updatedAt: -1 });

        // Format the response
        const messagedUsers = conversations
            .filter(conv => conv.participants && conv.participants.length > 0)
            .map(conv => {
                const otherUser = conv.participants[0];
                const lastMessage = conv.lastMessage;
                
                return {
                    _id: otherUser._id,
                    username: otherUser.username,
                    fullName: otherUser.fullName,
                    profilePicture: otherUser.profilePicture,
                    isVerified: otherUser.verified,
                    status: otherUser.status,
                    lastSeen: otherUser.lastSeen,
                    conversationId: conv._id,
                    lastMessage: lastMessage ? {
                        text: lastMessage.text,
                        messageType: lastMessage.messageType,
                        createdAt: lastMessage.createdAt,
                        isOwn: lastMessage.senderId?.toString() === currentUserId.toString(),
                        read: lastMessage.read
                    } : null,
                    unreadCount: conv.unreadCount?.get(currentUserId.toString()) || 0,
                    updatedAt: conv.updatedAt
                };
            });

        res.status(200).json({
            success: true,
            users: messagedUsers,
            total: messagedUsers.length
        });
    } catch (error) {
        console.error("Error in getMessagedUsers:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ========== SAVE/UNSAVE CONTENT CONTROLLERS ==========

export const toggleSavePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const user = await User.findById(userId);
        const isSaved = user.savedPosts.includes(postId);

        if (isSaved) {
            // Unsave
            user.savedPosts.pull(postId);
            post.saves.pull(userId);
        } else {
            // Save
            user.savedPosts.push(postId);
            post.saves.push(userId);
        }

        await Promise.all([user.save(), post.save()]);

        res.status(200).json({
            success: true,
            saved: !isSaved,
            savesCount: post.saves.length
        });
    } catch (error) {
        console.error("Error in toggleSavePost:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const toggleSaveReel = async (req, res) => {
    try {
        const { reelId } = req.params;
        const userId = req.user._id;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({
                success: false,
                message: "Reel not found"
            });
        }

        const user = await User.findById(userId);
        const isSaved = user.savedReels.includes(reelId);

        if (isSaved) {
            // Unsave
            user.savedReels.pull(reelId);
            reel.saves.pull(userId);
        } else {
            // Save
            user.savedReels.push(reelId);
            reel.saves.push(userId);
        }

        await Promise.all([user.save(), reel.save()]);

        res.status(200).json({
            success: true,
            saved: !isSaved,
            savesCount: reel.saves.length
        });
    } catch (error) {
        console.error("Error in toggleSaveReel:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const getSavedContent = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type = 'all', page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const user = await User.findById(userId)
            .populate({
                path: 'savedPosts',
                populate: {
                    path: 'user',
                    select: 'username fullName profilePicture verified'
                },
                options: { skip, limit: parseInt(limit) }
            })
            .populate({
                path: 'savedReels',
                populate: {
                    path: 'user',
                    select: 'username fullName profilePicture verified'
                },
                options: { skip, limit: parseInt(limit) }
            });

        let savedContent = [];
        let total = 0;

        if (type === 'posts' || type === 'all') {
            savedContent = [...savedContent, ...user.savedPosts];
            total += user.savedPosts.length;
        }

        if (type === 'reels' || type === 'all') {
            savedContent = [...savedContent, ...user.savedReels];
            total += user.savedReels.length;
        }

        // Sort by saved date (most recent first)
        savedContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            success: true,
            savedContent,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: total > (skip + parseInt(limit))
        });
    } catch (error) {
        console.error("Error in getSavedContent:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ========== USER SETTINGS & STATUS CONTROLLERS ==========

export const updateUserStatus = async (req, res) => {
    try {
        const { status, lastSeen } = req.body;
        const userId = req.user._id;

        // Validate status
        const validStatuses = ['online', 'offline', 'away'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be 'online', 'offline', or 'away'"
            });
        }

        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (lastSeen !== undefined) {
            updateData.lastSeen = new Date(lastSeen);
        } else if (status === 'offline') {
            updateData.lastSeen = new Date();
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select("-password");

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                status: user.status,
                lastSeen: user.lastSeen,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error("Error in updateUserStatus:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

export const updateUserSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            emailNotifications,
            pushNotifications,
            privateAccount,
            showActivityStatus,
            allowTagging,
            allowComments
        } = req.body;

        const updateData = {};

        if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
        if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
        if (privateAccount !== undefined) updateData.private = privateAccount;
        if (showActivityStatus !== undefined) updateData.showActivityStatus = showActivityStatus;
        if (allowTagging !== undefined) updateData.allowTagging = allowTagging;
        if (allowComments !== undefined) updateData.allowComments = allowComments;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            settings: {
                emailNotifications: updatedUser.emailNotifications,
                pushNotifications: updatedUser.pushNotifications,
                privateAccount: updatedUser.private,
                showActivityStatus: updatedUser.showActivityStatus,
                allowTagging: updatedUser.allowTagging,
                allowComments: updatedUser.allowComments
            },
            message: "Settings updated successfully"
        });
    } catch (error) {
        console.error("Error in updateUserSettings:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ========== ACCOUNT MANAGEMENT CONTROLLERS ==========

export const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const { password } = req.body;

        // Require password confirmation for security
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password confirmation is required"
            });
        }

        // Verify password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
        }

        console.log(`Starting account deletion for user: ${userId}`);

        // 1. Delete user's profile picture from Cloudinary if exists
        if (user.profilePicture) {
            try {
                const publicId = user.profilePicture.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`profile-pictures/${publicId}`);
                console.log('Profile picture deleted from Cloudinary');
            } catch (cloudinaryError) {
                console.warn('Could not delete profile picture from Cloudinary:', cloudinaryError.message);
            }
        }

        // 2. Delete user's posts and their media
        const userPosts = await Post.find({ user: userId });
        for (const post of userPosts) {
            // Delete post media from Cloudinary
            for (const mediaUrl of post.media) {
                try {
                    const publicId = mediaUrl.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`posts/${publicId}`);
                } catch (error) {
                    console.warn(`Could not delete media ${mediaUrl}:`, error.message);
                }
            }
        }
        await Post.deleteMany({ user: userId });
        console.log(`Deleted ${userPosts.length} posts`);

        // 3. Delete user's reels and their media
        const userReels = await Reel.find({ user: userId });
        for (const reel of userReels) {
            try {
                const videoPublicId = reel.video.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`reels/${videoPublicId}`, { resource_type: 'video' });

                if (reel.thumbnail) {
                    const thumbPublicId = reel.thumbnail.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`reels/${thumbPublicId}`);
                }
            } catch (error) {
                console.warn(`Could not delete reel ${reel._id}:`, error.message);
            }
        }
        await Reel.deleteMany({ user: userId });
        console.log(`Deleted ${userReels.length} reels`);

        // 4. Delete user's comments
        await Comment.deleteMany({ user: userId });
        console.log('Deleted user comments');

        // 5. Delete user's messages
        await Message.deleteMany({
            $or: [{ senderId: userId }, { receiverId: userId }],
        });
        console.log('Deleted user messages');

        // 6. Delete user's conversations
        await Conversation.deleteMany({
            participants: userId,
        });
        console.log('Deleted user conversations');

        // 7. Delete notifications involving the user
        await Notification.deleteMany({
            $or: [
                { recipient: userId },
                { sender: userId }
            ]
        });
        console.log('Deleted user notifications');

        // 8. Remove user from other users' followers/following lists
        await User.updateMany(
            { followers: userId },
            { $pull: { followers: userId } }
        );

        await User.updateMany(
            { following: userId },
            { $pull: { following: userId } }
        );
        console.log('Removed user from followers/following lists');

        // 9. Remove user from post/reel likes and saves
        await Post.updateMany(
            { likes: userId },
            { $pull: { likes: userId } }
        );

        await Post.updateMany(
            { saves: userId },
            { $pull: { saves: userId } }
        );

        await Reel.updateMany(
            { likes: userId },
            { $pull: { likes: userId } }
        );

        await Reel.updateMany(
            { saves: userId },
            { $pull: { saves: userId } }
        );
        console.log('Removed user from likes and saves');

        // 10. Delete the user
        await User.findByIdAndDelete(userId);
        console.log('User deleted from database');

        // 11. Clear authentication cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        res.status(200).json({
            success: true,
            message: "Account and all associated data deleted successfully"
        });

    } catch (error) {
        console.error("Error in deleteUserAccount:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to delete account. Please try again later."
        });
    }
};

// ========== PROFILE COMPLETENESS CHECK ==========

export const checkProfileCompleteness = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('profilePicture bio website fullName');

        let completenessScore = 0;
        const totalPoints = 5;
        const missingFields = [];

        // Check profile picture (2 points)
        if (user.profilePicture) {
            completenessScore += 2;
        } else {
            missingFields.push('profile picture');
        }

        // Check bio (1 point)
        if (user.bio && user.bio.trim() !== '') {
            completenessScore += 1;
        } else {
            missingFields.push('bio');
        }

        // Check website (1 point)
        if (user.website && user.website.trim() !== '') {
            completenessScore += 1;
        } else {
            missingFields.push('website');
        }

        // Check full name (1 point)
        if (user.fullName && user.fullName.trim() !== '') {
            completenessScore += 1;
        } else {
            missingFields.push('full name');
        }

        const percentage = Math.round((completenessScore / totalPoints) * 100);

        res.status(200).json({
            success: true,
            completeness: {
                percentage,
                score: completenessScore,
                total: totalPoints,
                missingFields,
                isComplete: percentage >= 80
            }
        });
    } catch (error) {
        console.error("Error in checkProfileCompleteness:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

// ========== UPDATE PROFILE CONTROLLER ==========

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            fullName,
            bio,
            website,
            gender,
            location,
            profilePicture,
            removeProfilePicture
        } = req.body;

        const updateData = {};

        if (fullName !== undefined) updateData.fullName = fullName;
        if (bio !== undefined) updateData.bio = bio;
        if (website !== undefined) updateData.website = website;
        if (gender !== undefined) updateData.gender = gender;
        if (location !== undefined) updateData.location = location;

        // Handle profile picture update
        if (removeProfilePicture) {
            // Remove profile picture
            if (req.user.profilePicture) {
                try {
                    const publicId = req.user.profilePicture.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`profile-pictures/${publicId}`);
                } catch (error) {
                    console.warn('Could not delete old profile picture:', error.message);
                }
            }
            updateData.profilePicture = null;
        } else if (profilePicture) {
            // Upload new profile picture
            try {
                const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
                    folder: 'profile-pictures',
                    width: 500,
                    height: 500,
                    crop: 'fill'
                });

                // Delete old profile picture if exists
                if (req.user.profilePicture) {
                    const oldPublicId = req.user.profilePicture.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`profile-pictures/${oldPublicId}`);
                }

                updateData.profilePicture = uploadResponse.secure_url;
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload profile picture'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                profilePicture: updatedUser.profilePicture,
                bio: updatedUser.bio,
                website: updatedUser.website,
                gender: updatedUser.gender,
                location: updatedUser.location,
                isVerified: updatedUser.verified,
                status: updatedUser.status,
                lastSeen: updatedUser.lastSeen,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        console.error("Error in updateProfile:", error.message);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};