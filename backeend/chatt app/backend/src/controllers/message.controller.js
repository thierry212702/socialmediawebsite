import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Post from "../models/Post.model.js";
import Reel from "../models/Reel.model.js";
import Comment from "../models/Comment.model.js";
import Conversation from "../models/conversation.model.js";
import Notification from "../models/Notification.model.js";

// ==================== CHAT FUNCTIONS ====================
export const getUserForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json({
      success: true,
      users: filteredUsers,
    });
  } catch (error) {
    console.error("Error in getUserForSidebar:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ==================== NEW POST FUNCTIONS ====================

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Comment content is required"
      });
    }

    // Create comment
    const comment = new Comment({
      user: userId,
      post: postId,
      content: content.trim()
    });

    await comment.save();

    // Add comment to post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    post.comments.push(comment._id);
    await post.save();

    // Create notification if not commenting on own post
    if (post.user.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: "comment",
        post: postId,
        comment: comment._id
      });
    }

    // Populate comment with user info
    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "username fullName profilePicture");

    res.status(201).json({
      success: true,
      comment: populatedComment,
      message: "Comment added successfully"
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add comment"
    });
  }
};

// Get post comments
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const comments = await Comment.find({ post: postId })
      .populate("user", "username fullName profilePicture")
      .populate("replies")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({
      success: true,
      comments,
      total: await Comment.countDocuments({ post: postId })
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get comments"
    });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found"
      });
    }

    // Check if user owns the comment or is post owner
    const post = await Post.findById(postId);
    if (comment.user.toString() !== userId.toString() &&
      post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this comment"
      });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId }
    });

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete comment"
    });
  }
};

// Get explore posts
export const getExplorePosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get posts from users not followed by current user
    const user = await User.findById(userId).select("following");
    const followingIds = user.following;

    const posts = await Post.find({
      user: { $nin: [...followingIds, userId] }, // Exclude followed users and self
      isArchived: false
    })
      .populate("user", "username fullName profilePicture verified")
      .sort({ likes: -1, createdAt: -1 }) // Popular first
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      posts,
      total: posts.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error("Get explore posts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get explore posts"
    });
  }
};

// Search posts
export const searchPosts = async (req, res) => {
  try {
    const { q: query } = req.query;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        posts: [],
        total: 0
      });
    }

    const posts = await Post.find({
      $or: [
        { caption: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } }
      ],
      isArchived: false
    })
      .populate("user", "username fullName profilePicture verified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      posts,
      total: await Post.countDocuments({
        $or: [
          { caption: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } }
        ],
        isArchived: false
      })
    });
  } catch (error) {
    console.error("Search posts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search posts"
    });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    // Check if user owns the post
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this post"
      });
    }

    // Delete post media from Cloudinary
    for (const mediaUrl of post.media) {
      try {
        const publicId = mediaUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`posts/${publicId}`, {
          resource_type: post.mediaType === 'video' ? 'video' : 'image'
        });
      } catch (error) {
        console.warn(`Could not delete media ${mediaUrl}:`, error.message);
      }
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Remove from user's posts
    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });

    // Delete associated comments
    await Comment.deleteMany({ post: postId });

    // Delete associated notifications
    await Notification.deleteMany({ post: postId });

    res.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete post"
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
      .populate("senderId", "username fullName profilePicture")
      .populate("receiverId", "username fullName profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.log("Error in getting message:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Validate input
    if (!text && !image) {
      return res.status(400).json({
        success: false,
        error: "Message text or image is required",
      });
    }

    let imageUrl;
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "messages",
        });
        imageUrl = uploadResponse.secure_url;
      } catch (error) {
        console.error("Image upload error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to upload image",
        });
      }
    }

    // Create message
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
        lastMessage: newMessage._id,
        unreadCount: new Map([[receiverId, 1]]),
      });
    } else {
      conversation.lastMessage = newMessage._id;
      // Increment unread count for receiver
      const currentUnread = conversation.unreadCount.get(receiverId) || 0;
      conversation.unreadCount.set(receiverId, currentUnread + 1);
    }

    await conversation.save();

    // Populate message
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "username fullName profilePicture")
      .populate("receiverId", "username fullName profilePicture");

    res.status(201).json({
      success: true,
      message: populatedMessage,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.log("Error in sendMessage:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "username fullName profilePicture status",
        match: { _id: { $ne: userId } },
      })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.log("Error in getConversations:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== POST FUNCTIONS ====================
export const createPost = async (req, res) => {
  try {
    const { caption, location, tags } = req.body;
    const files = req.files || [];
    const userId = req.user._id;

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No media uploaded",
      });
    }

    // Upload media to Cloudinary
    const mediaUrls = [];
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "posts",
        resource_type: file.mimetype.startsWith("video") ? "video" : "image",
      });
      mediaUrls.push(result.secure_url);
    }

    // Determine media type
    let mediaType = "image";
    if (files.length > 1) {
      mediaType = "carousel";
    } else if (files[0].mimetype.startsWith("video")) {
      mediaType = "video";
    }

    // Create post
    const post = new Post({
      user: userId,
      caption,
      media: mediaUrls,
      mediaType,
      location,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    });

    await post.save();

    // Add post to user's posts
    await User.findByIdAndUpdate(userId, {
      $push: { posts: post._id },
    });

    // Populate user details
    const populatedPost = await Post.findById(post._id).populate(
      "user",
      "username fullName profilePicture verified"
    );

    res.status(201).json({
      success: true,
      post: populatedPost,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create post",
    });
  }
};

export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get users that current user follows
    const user = await User.findById(userId).select("following");
    const followingIds = [...user.following, userId];

    const posts = await Post.find({
      user: { $in: followingIds },
      isArchived: false,
    })
      .populate("user", "username fullName profilePicture verified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Update views
    for (const post of posts) {
      post.views += 1;
      await post.save();
    }

    res.json({
      success: true,
      posts,
      total: posts.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get feed",
    });
  }
};
// ==================== GET USER POSTS ====================
export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user._id; // Current logged-in user

    console.log(`Fetching posts for user: ${username} by viewer: ${userId}`);

    // Find the target user by username
    const targetUser = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    }).select("username fullName profilePicture bio followers following");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get all posts by this user
    const posts = await Post.find({
      user: targetUser._id,
      isArchived: false
    })
      .populate("user", "username fullName profilePicture verified")
      .sort({ createdAt: -1 });

    // Format posts with additional info
    const formattedPosts = posts.map(post => {
      const isLiked = post.likes.some(
        likeId => likeId && likeId.toString() === userId.toString()
      );

      return {
        _id: post._id,
        user: {
          _id: post.user._id,
          username: post.user.username,
          fullName: post.user.fullName,
          profilePicture: post.user.profilePicture,
          verified: post.user.verified || false
        },
        caption: post.caption || "",
        media: post.media || [],
        mediaType: post.mediaType || "image",
        likes: post.likes || [],
        likesCount: post.likes.length || 0,
        comments: post.comments || [],
        commentsCount: post.comments.length || 0,
        views: post.views || 0,
        shares: post.shares || 0,
        isLiked: isLiked,
        location: post.location || "",
        tags: post.tags || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
    });

    // Check if current user follows this user
    const isFollowing = targetUser.followers.some(
      followerId => followerId && followerId.toString() === userId.toString()
    );

    const userInfo = {
      _id: targetUser._id,
      username: targetUser.username,
      fullName: targetUser.fullName,
      profilePicture: targetUser.profilePicture || "",
      bio: targetUser.bio || "",
      followersCount: targetUser.followers?.length || 0,
      followingCount: targetUser.following?.length || 0,
      postsCount: formattedPosts.length,
      isFollowing: isFollowing,
      isOwnProfile: targetUser._id.toString() === userId.toString()
    };

    res.status(200).json({
      success: true,
      posts: formattedPosts,
      userInfo: userInfo,
      totalPosts: formattedPosts.length,
      message: `Found ${formattedPosts.length} posts for ${username}`
    });

  } catch (error) {
    console.error("Error in getUserPosts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user posts",
      message: error.message
    });
  }
};
export const toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes.pull(userId);
      await post.save();
    } else {
      // Like
      post.likes.push(userId);
      await post.save();

      // Create notification if not liking own post
      if (post.user.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: postId,
        });
      }
    }

    res.json({
      success: true,
      liked: !isLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle like",
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, skip = 0 } = req.query;

    const notifications = await Notification.find({
      recipient: userId,
    })
      .populate("sender", "username fullName profilePicture")
      .populate("post", "media mediaType caption")
      .populate("reel", "thumbnail caption")
      .populate("comment")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Mark as read
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      notifications,
      unreadCount: await Notification.countDocuments({
        recipient: userId,
        read: false,
      }),
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get notifications",
    });
  }
};