import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { postAPI, userAPI } from '../../utils/api';
import {
    FaHeart,
    FaRegHeart,
    FaComment,
    FaShare,
    FaBookmark,
    FaRegBookmark,
    FaEllipsisH,
    FaPaperPlane,
    FaSmile,
    FaTrash,
    FaEdit,
    FaFlag
} from 'react-icons/fa';

const Post = ({ post, onLike, currentUser, socket }) => {
    const { showToast } = useAuth();
    const { sendMessage } = useSocket();
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?._id));
    const [isSaved, setIsSaved] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount || post.likes?.length || 0);
    const [showOptions, setShowOptions] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        // Listen for real-time updates
        if (socket) {
            socket.on('postLiked', handlePostLiked);
            socket.on('postCommented', handlePostCommented);

            return () => {
                socket.off('postLiked', handlePostLiked);
                socket.off('postCommented', handlePostCommented);
            };
        }
    }, [socket]);

    useEffect(() => {
        if (showComments && comments.length === 0) {
            fetchComments();
        }
    }, [showComments]);

    const handlePostLiked = (data) => {
        if (data.postId === post._id) {
            setLikesCount(data.likesCount);
            setIsLiked(data.liked);
        }
    };

    const handlePostCommented = (data) => {
        if (data.postId === post._id) {
            fetchComments();
        }
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const response = await postAPI.getPostComments(post._id);
            if (response.data.success) {
                setComments(response.data.comments || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleLike = async () => {
        try {
            setIsLiked(!isLiked);
            setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

            await postAPI.toggleLikePost(post._id);

            // Emit socket event
            if (socket) {
                socket.emit('toggleLikePost', {
                    postId: post._id,
                    userId: currentUser._id
                });
            }
        } catch (error) {
            console.error('Error liking post:', error);
            showToast('Failed to like post', 'error');
            setIsLiked(!isLiked);
            setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaved(!isSaved);
            await userAPI.toggleSavePost(post._id);
            showToast(isSaved ? 'Removed from saved' : 'Saved to collection', 'success');
        } catch (error) {
            console.error('Error saving post:', error);
            showToast('Failed to save post', 'error');
            setIsSaved(!isSaved);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const response = await postAPI.addCommentToPost(post._id, comment);
            if (response.data.success) {
                const newComment = response.data.comment;
                setComments(prev => [newComment, ...prev]);
                setComment('');

                // Emit socket event
                if (socket) {
                    socket.emit('newComment', {
                        postId: post._id,
                        commentId: newComment._id
                    });
                }

                showToast('Comment added', 'success');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('Failed to add comment', 'error');
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Post by ${post.user?.username}`,
                    text: post.caption,
                    url: window.location.origin + `/post/${post._id}`,
                });
            } else {
                navigator.clipboard.writeText(window.location.origin + `/post/${post._id}`);
                showToast('Link copied to clipboard', 'success');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!currentUser) return;

        try {
            const message = `Check out this post by ${post.user?.username}: ${post.caption?.substring(0, 100)}...`;

            // Send message via socket
            sendMessage({
                senderId: currentUser._id,
                receiverId: post.user?._id,
                text: message
            });

            showToast('Sent via message', 'success');
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message', 'error');
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await postAPI.deletePost(post._id);
            showToast('Post deleted successfully', 'success');
            // You might want to refresh the feed or remove this post from the list
            window.dispatchEvent(new CustomEvent('post-deleted', { detail: post._id }));
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast('Failed to delete post', 'error');
        }
    };

    const formatTime = (date) => {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
    };

    const isOwnPost = post.user?._id === currentUser?._id;

    return (
        <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                    <a href={`/profile/${post.user?.username}`} className="relative">
                        <img
                            src={post.user?.profilePicture || '/default-avatar.png'}
                            alt={post.user?.username}
                            className="w-10 h-10 rounded-full border-2 border-white shadow"
                        />
                    </a>
                    <div>
                        <a href={`/profile/${post.user?.username}`} className="font-semibold hover:text-primary">
                            {post.user?.username}
                        </a>
                        <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-500">{formatTime(post.createdAt)}</p>
                            {post.location && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <p className="text-sm text-gray-500">{post.location}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                    >
                        <FaEllipsisH />
                    </button>

                    {showOptions && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            {isOwnPost ? (
                                <>
                                    <button
                                        onClick={handleDeletePost}
                                        className="flex items-center space-x-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-t-lg transition-colors"
                                    >
                                        <FaTrash />
                                        <span>Delete Post</span>
                                    </button>
                                    <button className="flex items-center space-x-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                                        <FaEdit />
                                        <span>Edit Post</span>
                                    </button>
                                </>
                            ) : (
                                <button className="flex items-center space-x-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors">
                                    <FaFlag />
                                    <span>Report Post</span>
                                </button>
                            )}
                            <button className="flex items-center space-x-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors border-t border-gray-100">
                                <FaShare />
                                <span>Copy Link</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Media */}
            {post.media && post.media.length > 0 && (
                <div className="relative">
                    {post.mediaType === 'video' ? (
                        <video
                            src={post.media[0]}
                            controls
                            className="w-full max-h-[500px] object-contain bg-black"
                        />
                    ) : (
                        <img
                            src={post.media[0]}
                            alt="Post media"
                            className="w-full max-h-[500px] object-contain"
                        />
                    )}
                    {post.media.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            {post.media.length} photos
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleLike}
                            className="text-xl transition-transform hover:scale-110 active:scale-95"
                        >
                            {isLiked ? (
                                <FaHeart className="text-red-500" />
                            ) : (
                                <FaRegHeart className="text-gray-700 hover:text-red-500" />
                            )}
                        </button>
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="text-xl text-gray-700 hover:text-blue-500 transition-transform hover:scale-110"
                        >
                            <FaComment />
                        </button>
                        <button
                            onClick={handleShare}
                            className="text-xl text-gray-700 hover:text-green-500 transition-transform hover:scale-110"
                        >
                            <FaShare />
                        </button>
                        <button
                            onClick={handleSendMessage}
                            className="text-xl text-gray-700 hover:text-purple-500 transition-transform hover:scale-110"
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        className="text-xl transition-transform hover:scale-110"
                    >
                        {isSaved ? (
                            <FaBookmark className="text-primary" />
                        ) : (
                            <FaRegBookmark className="text-gray-700 hover:text-primary" />
                        )}
                    </button>
                </div>

                {/* Likes Count */}
                <div className="mb-3">
                    <span className="font-semibold">{likesCount.toLocaleString()} likes</span>
                </div>

                {/* Caption */}
                {post.caption && (
                    <div className="mb-3">
                        <a href={`/profile/${post.user?.username}`} className="font-semibold mr-2 hover:text-primary">
                            {post.user?.username}
                        </a>
                        <span className="text-gray-800">{post.caption}</span>
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map(tag => (
                                <a
                                    key={tag}
                                    href={`/explore?tag=${tag}`}
                                    className="text-primary hover:text-primary/80 text-sm"
                                >
                                    #{tag}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* View Comments */}
                {post.commentsCount > 0 && !showComments && (
                    <button
                        onClick={() => setShowComments(true)}
                        className="text-gray-500 text-sm mb-3 hover:text-gray-700"
                    >
                        View all {post.commentsCount} comments
                    </button>
                )}

                {/* Comments Section */}
                {showComments && (
                    <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                        {loadingComments ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-2">No comments yet</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment._id} className="flex items-start space-x-2">
                                    <a href={`/profile/${comment.user?.username}`}>
                                        <img
                                            src={comment.user?.profilePicture || '/default-avatar.png'}
                                            alt={comment.user?.username}
                                            className="w-6 h-6 rounded-full mt-1"
                                        />
                                    </a>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <a
                                                href={`/profile/${comment.user?.username}`}
                                                className="font-semibold text-sm hover:text-primary"
                                            >
                                                {comment.user?.username}
                                            </a>
                                            <p className="text-sm mt-1">{comment.content}</p>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 px-2">
                                            {formatTime(comment.createdAt)}
                                            <button className="ml-2 text-primary hover:text-primary/80">
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Add Comment */}
                <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <button type="button" className="text-gray-500 hover:text-gray-700">
                        <FaSmile />
                    </button>
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 p-2 border-none bg-transparent focus:outline-none focus:ring-0"
                    />
                    <button
                        type="submit"
                        disabled={!comment.trim()}
                        className="text-primary font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary/80"
                    >
                        Post
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Post;