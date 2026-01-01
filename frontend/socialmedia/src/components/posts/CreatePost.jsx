import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { postAPI } from "../../utils/api";
import { FaTimes, FaImage, FaVideo, FaSmile, FaMapMarkerAlt } from "react-icons/fa";


const CreatePost = ({ onClose, onSuccess }) => {
    const { user, showToast } = useAuth();
    const [caption, setCaption] = useState('');
    const [media, setMedia] = useState([]);
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Media, 2: Caption

    const handleMediaUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + media.length > 10) {
            showToast('Maximum 10 files allowed', 'error');
            return;
        }
        setMedia([...media, ...files]);
    };

    const removeMedia = (index) => {
        setMedia(media.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (media.length === 0) {
            showToast('Please select at least one media file', 'error');
            return;
        }

        setLoading(true);
        try {
            const postData = {
                caption,
                location,
                media,
            };

            const response = await postAPI.createPost(postData);
            if (response.data.success) {
                onSuccess(response.data.post);
                onClose();
            }
        } catch (error) {
            console.error('Error creating post:', error);
            showToast('Failed to create post', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-color">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex border-b border-border-color">
                    <button
                        className={`flex-1 py-3 text-center font-medium ${step === 1 ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                        onClick={() => setStep(1)}
                    >
                        Media
                    </button>
                    <button
                        className={`flex-1 py-3 text-center font-medium ${step === 2 ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                        onClick={() => setStep(2)}
                        disabled={media.length === 0}
                    >
                        Caption
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Media Selection */}
                    {step === 1 && (
                        <div className="p-6">
                            <div className="border-2 border-dashed border-border-color rounded-lg p-8 text-center">
                                <FaImage className="text-4xl text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-700 mb-2">Drag photos and videos here</h3>
                                <p className="text-gray-500 mb-4">or select from computer</p>
                                <label className="inline-block bg-primary text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                                    Select Files
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleMediaUpload}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-sm text-gray-400 mt-2">Maximum 10 files, up to 50MB each</p>
                            </div>

                            {/* Selected Media Preview */}
                            {media.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-700 mb-3">
                                        Selected ({media.length} file{media.length > 1 ? 's' : ''})
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {media.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedia(index)}
                                                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <FaTimes className="text-sm" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={media.length === 0}
                                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Caption & Details */}
                    {step === 2 && (
                        <div className="p-6">
                            {/* User Info */}
                            <div className="flex items-center space-x-3 mb-6">
                                <img
                                    src={user?.profilePicture || '/default-avatar.png'}
                                    alt={user?.username}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <h4 className="font-medium">{user?.username}</h4>
                                    <p className="text-sm text-gray-500">Posting to your profile</p>
                                </div>
                            </div>

                            {/* Caption */}
                            <div className="mb-6">
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Write a caption..."
                                    className="w-full h-40 p-4 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    maxLength={2200}
                                />
                                <div className="text-right text-sm text-gray-500 mt-2">
                                    {caption.length}/2200
                                </div>
                            </div>

                            {/* Location */}
                            <div className="mb-6">
                                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                                    <FaMapMarkerAlt />
                                    <span>Add Location</span>
                                </div>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Add location"
                                    className="w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Back
                                </button>
                                <div className="space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2 border border-border-color rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Posting...' : 'Share Post'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CreatePost;