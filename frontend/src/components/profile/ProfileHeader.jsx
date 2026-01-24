import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus, MessageCircle, Check, Loader, Phone, Video, MoreVertical } from 'lucide-react';
import userService from '../../services/user.service';
import chatService from '../../services/chat.service';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';

const ProfileHeader = ({ user, isOwnProfile }) => {
    const { user: currentUser } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [isFollowing, setIsFollowing] = useState(currentUser?.following?.includes(user._id) || false);
    const [showOptions, setShowOptions] = useState(false);

    // Check if user follows current user back
    const isFollowedBack = user?.followers?.includes(currentUser?._id) && user?.following?.includes(currentUser?._id);
    
    // Check if current user follows this user
    const isFollowingYou = user?.following?.includes(currentUser?._id);

    // Follow mutation
    const followMutation = useMutation({
        mutationFn: () => userService.followUser(user._id),
        onMutate: async () => {
            setIsFollowing(true);
            // Optimistic update
            queryClient.setQueryData(['user', user.username], (oldData) => ({
                ...oldData,
                followers: [...(oldData?.followers || []), currentUser._id],
                followersCount: (oldData?.followersCount || 0) + 1
            }));
        },
        onSuccess: (data) => {
            toast.success(`You are now following @${user.username}`);
            
            // Send notification via socket
            if (socket) {
                socket.emit('sendNotification', {
                    receiverId: user._id,
                    type: 'follow',
                    message: `${currentUser.username} started following you`,
                    sender: currentUser
                });
            }
            
            queryClient.invalidateQueries(['user', user.username]);
            queryClient.invalidateQueries(['current-user']);
        },
        onError: (error) => {
            setIsFollowing(false);
            toast.error('Failed to follow user');
        },
    });

    // Unfollow mutation
    const unfollowMutation = useMutation({
        mutationFn: () => userService.unfollowUser(user._id),
        onMutate: async () => {
            setIsFollowing(false);
            // Optimistic update
            queryClient.setQueryData(['user', user.username], (oldData) => ({
                ...oldData,
                followers: (oldData?.followers || []).filter(id => id !== currentUser._id),
                followersCount: Math.max(0, (oldData?.followersCount || 1) - 1)
            }));
        },
        onSuccess: () => {
            toast.success(`Unfollowed @${user.username}`);
            queryClient.invalidateQueries(['user', user.username]);
            queryClient.invalidateQueries(['current-user']);
        },
        onError: () => {
            setIsFollowing(true);
            toast.error('Failed to unfollow user');
        },
    });

    const handleFollow = () => {
        if (isFollowing) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    const handleMessage = async () => {
        try {
            // Check if conversation exists
            const conversations = await chatService.getConversations();
            const existingConversation = conversations.find(conv => 
                conv.participants.some(p => p._id === user._id)
            );

            if (existingConversation) {
                // Navigate to existing conversation
                window.location.href = `/messages/${user._id}`;
            } else {
                // Send a first message to start conversation
                const message = await chatService.sendMessage(user._id, {
                    text: `Hello ${user.username}! 👋`
                });
                
                toast.success('Message sent! Starting conversation...');
                setTimeout(() => {
                    window.location.href = `/messages/${user._id}`;
                }, 1000);
            }
        } catch (error) {
            toast.error('Failed to start conversation');
        }
    };

    const initiateCall = (type) => {
        if (!socket) return;
        
        socket.emit('initiateCall', {
            receiverId: user._id,
            type: type,
            callerName: currentUser.username
        });
        
        toast.success(`Starting ${type} call with ${user.username}...`);
    };

    return (
        <div className="glass-card p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div className="flex items-start space-x-6">
                    <div className="relative">
                        <img
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=linear-gradient(45deg,#3b82f6,#8b5cf6)&size=200`}
                            alt={user.username}
                            className="w-32 h-32 rounded-2xl object-cover border-4 border-gray-800/50 shadow-2xl"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center space-x-3 mb-3">
                            <h1 className="text-3xl font-bold text-gray-200">{user.username}</h1>
                            {user.verified && (
                                <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-medium rounded-full">
                                    ✓ Verified
                                </span>
                            )}
                        </div>
                        
                        {user.fullName && (
                            <p className="text-gray-300 text-lg mb-4">{user.fullName}</p>
                        )}
                        
                        <div className="flex space-x-8 mb-4">
                            <div>
                                <span className="font-bold text-2xl text-gray-200">{user.postsCount || 0}</span>
                                <span className="text-gray-400 ml-2">Posts</span>
                            </div>
                            <div>
                                <span className="font-bold text-2xl text-gray-200">{user.followersCount || 0}</span>
                                <span className="text-gray-400 ml-2">Followers</span>
                            </div>
                            <div>
                                <span className="font-bold text-2xl text-gray-200">{user.followingCount || 0}</span>
                                <span className="text-gray-400 ml-2">Following</span>
                            </div>
                        </div>
                        
                        {user.bio && (
                            <p className="text-gray-300 max-w-lg">{user.bio}</p>
                        )}
                    </div>
                </div>

                {!isOwnProfile && (
                    <div className="flex flex-wrap gap-3 mt-6 md:mt-0">
                        {/* Follow Status Indicators */}
                        {isFollowedBack && (
                            <div className="flex items-center px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-xl">
                                <Check className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Follows you back</span>
                            </div>
                        )}
                        
                        {isFollowingYou && !isFollowedBack && (
                            <div className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 rounded-xl">
                                <UserPlus className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Follows you</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <button
                            onClick={handleFollow}
                            disabled={followMutation.isLoading || unfollowMutation.isLoading}
                            className={`px-6 py-3 rounded-xl font-medium flex items-center transition-all duration-300 ${
                                isFollowing
                                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                            }`}
                        >
                            {(followMutation.isLoading || unfollowMutation.isLoading) ? (
                                <Loader className="w-5 h-5 animate-spin mr-2" />
                            ) : isFollowing ? (
                                <UserMinus className="w-5 h-5 mr-2" />
                            ) : (
                                <UserPlus className="w-5 h-5 mr-2" />
                            )}
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>

                        {/* Message button - only if following */}
                        {isFollowing && (
                            <button
                                onClick={handleMessage}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 flex items-center"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Message
                            </button>
                        )}

                        {/* Call buttons - only if following */}
                        {isFollowing && (
                            <>
                                <button
                                    onClick={() => initiateCall('audio')}
                                    className="p-3 bg-gradient-to-r from-blue-600/20 to-blue-600/10 text-blue-400 rounded-xl hover:from-blue-600/30 hover:to-blue-600/20 border border-blue-600/20"
                                    title="Audio Call"
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                                
                                <button
                                    onClick={() => initiateCall('video')}
                                    className="p-3 bg-gradient-to-r from-purple-600/20 to-purple-600/10 text-purple-400 rounded-xl hover:from-purple-600/30 hover:to-purple-600/20 border border-purple-600/20"
                                    title="Video Call"
                                >
                                    <Video className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* More options */}
                        <div className="relative">
                            <button
                                onClick={() => setShowOptions(!showOptions)}
                                className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 text-gray-400 rounded-xl hover:text-gray-300 border border-gray-700/50"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {showOptions && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-800/50 py-2 z-10">
                                    <button className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800/50 transition-colors">
                                        Block User
                                    </button>
                                    <button className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                        Report
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileHeader;