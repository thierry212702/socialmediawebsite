import React, { useState } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import { uploadImage, uploadFile } from '../../services/chat.service';

const MediaUploader = ({ onUploadComplete, receiverId }) => {
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validate file size (10MB max)
        if (selectedFile.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !receiverId) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('receiverId', receiverId);

            if (file.type.startsWith('image/')) {
                await uploadImage(formData);
            } else {
                await uploadFile(formData);
            }

            if (onUploadComplete) {
                onUploadComplete();
            }

            // Reset
            setFile(null);
            setPreview(null);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-3">
                <label className="cursor-pointer p-3 bg-gray-100 rounded-full hover:bg-gray-200">
                    <ImageIcon className="w-6 h-6 text-gray-600" />
                    <input
                        type="file"
                        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>

                {file && (
                    <div className="flex-1">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-3">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-blue-600" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium truncate max-w-xs">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Send'}
                                </button>
                                <button
                                    onClick={removeFile}
                                    className="p-2 hover:bg-gray-200 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaUploader;