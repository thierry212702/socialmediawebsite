import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { username, fullName, email, password } = req.body;
    try {
        // Validations
        if (!username || !fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required!",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must have at least 8 characters!",
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: "Username can only contain letters, numbers, and underscores (3-30 characters)",
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "Username already taken",
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username: username.toLowerCase(),
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            profilePicture: "https://res.cloudinary.com/demo/image/upload/v1691234567/default-profile.png",
            bio: "",
            followers: [],
            following: [],
            posts: [],
            reels: [],
            savedPosts: [],
            savedReels: [],
            private: false,
            verified: false,
            status: "offline",
        });
           
        // Save user
        await newUser.save();

        // Generate JWT token
       const token = generateToken(newUser._id, res);

        // Return user data (without password)
        res.status(201).json({
            success: true,
            token: token,
            user: {
                _id: newUser._id,
                username: newUser.username,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
                bio: newUser.bio,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                reelsCount: 0,
                isPrivate: newUser.private,
                isVerified: newUser.verified,
                status: newUser.status,
            },
            message: "Account created successfully!",
        });
    } catch (error) {
        console.error("Error in signup:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find user by email or username
        const user = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }],
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email/username or password",
            });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Invalid email/username or password",
            });
        }

        // Update user status
        user.status = "online";
        user.lastSeen = new Date();
        await user.save();

        // Generate JWT token - GET THE RETURNED TOKEN
        const token = generateToken(user._id, res);

        // Return user data WITH TOKEN
        res.status(200).json({
            success: true,
            token: token, // ADD THIS LINE - send token in response body
            user: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                followersCount: user.followers.length,
                followingCount: user.following.length,
                postsCount: user.posts.length,
                reelsCount: user.reels.length,
                isPrivate: user.private,
                isVerified: user.verified,
                status: user.status,
                lastSeen: user.lastSeen,
            },
            message: "Login successful!",
        });
    } catch (error) {
        console.error("Error in login:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const logout = async (req, res) => {
    try {
        const userId = req.user._id;

        // Update user status to offline
        await User.findByIdAndUpdate(userId, {
            status: "offline",
            lastSeen: new Date(),
        });

        // Clear JWT cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Error in logout:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, bio, website, gender, location, isPrivate } = req.body;
        const profilePicture = req.file;

        const updateData = {};

        // Text fields
        if (fullName) updateData.fullName = fullName;
        if (bio !== undefined) updateData.bio = bio;
        if (website !== undefined) updateData.website = website;
        if (gender) updateData.gender = gender;
        if (location !== undefined) updateData.location = location;
        if (isPrivate !== undefined) updateData.private = isPrivate === "true";

        // Handle profile picture upload
        if (profilePicture) {
            try {
                // Upload to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(profilePicture.path, {
                    folder: "profile-pictures",
                    width: 400,
                    height: 400,
                    crop: "fill",
                    quality: "auto",
                });

                updateData.profilePicture = uploadResult.secure_url;
            } catch (uploadError) {
                console.error("Profile picture upload error:", uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload profile picture",
                });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        }).select("-password");

        res.status(200).json({
            success: true,
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
                followersCount: updatedUser.followers.length,
                followingCount: updatedUser.following.length,
                postsCount: updatedUser.posts.length,
                reelsCount: updatedUser.reels.length,
                isPrivate: updatedUser.private,
                isVerified: updatedUser.verified,
                status: updatedUser.status,
                lastSeen: updatedUser.lastSeen,
            },
            message: "Profile updated successfully!",
        });
    } catch (error) {
        console.error("Error in updating profile:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture || '',
                bio: user.bio || '',
                website: user.website || '',
                location: user.location || '',
                followers: user.followers || [],
                following: user.following || [],
                followersCount: user.followers?.length || 0,
                followingCount: user.following?.length || 0,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
};
export const checkAuth = async (req, res) => {
    try {
        const user = req.user;

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                website: user.website,
                gender: user.gender,
                location: user.location,
                followersCount: user.followers.length,
                followingCount: user.following.length,
                postsCount: user.posts.length,
                reelsCount: user.reels.length,
                isPrivate: user.private,
                isVerified: user.verified,
                status: user.status,
                lastSeen: user.lastSeen,
                savedPosts: user.savedPosts || [],
                savedReels: user.savedReels || [],
            },
        });
    } catch (error) {
        console.error("Error in checking auth:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match",
            });
        }

        // Get user
        const user = await User.findById(userId);

        // Check current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Error changing password:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};