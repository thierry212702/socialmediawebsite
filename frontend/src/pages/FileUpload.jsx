import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Image, Video, Music, FileText, X, Send, Folder, Cloud, Check, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const mockUploadFile = async (formData) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'File uploaded successfully',
        fileUrl: 'https://example.com/uploaded-file'
      });
    }, 2000);
  });
};

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: getFileType(file.type),
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
      '*/*': [] // Allow all files
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB max
  });

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    return 'other';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-6 h-6 text-blue-400" />;
      case 'video': return <Video className="w-6 h-6 text-purple-400" />;
      case 'audio': return <Music className="w-6 h-6 text-green-400" />;
      case 'pdf': return <FileText className="w-6 h-6 text-red-400" />;
      default: return <File className="w-6 h-6 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (!receiverId.trim()) {
      toast.error('Please enter a receiver ID');
      return;
    }

    setIsUploading(true);
    
    for (const fileObj of files) {
      try {
        setUploadProgress(prev => ({
          ...prev,
          [fileObj.id]: 0
        }));

        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('receiverId', receiverId);
        formData.append('message', message);

        // Simulate progress (in real app, use axios onUploadProgress)
        for (let i = 0; i <= 100; i += 10) {
          setTimeout(() => {
            setUploadProgress(prev => ({
              ...prev,
              [fileObj.id]: i
            }));
          }, i * 100);
        }

        await uploadFile(formData);
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));

        toast.success(`${fileObj.file.name} uploaded successfully!`);

      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'error' }
            : f
        ));
        toast.error(`Failed to upload ${fileObj.file.name}`);
      }
    }

    setIsUploading(false);
    // Clear files after successful upload
    setTimeout(() => {
      setFiles([]);
      setUploadProgress({});
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2 gradient-text">File Upload</h1>
        <p className="text-gray-400 mb-6">Upload and send files to your contacts</p>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 mb-8 ${
            isDragActive
              ? 'border-blue-500/50 bg-blue-500/5'
              : 'border-gray-700/50 bg-gray-900/30 hover:border-gray-600/50 hover:bg-gray-900/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Cloud className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium text-gray-200 mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-gray-400 mb-4">or click to select files</p>
            <p className="text-sm text-gray-500">
              Supports images, videos, audio, documents, and more (Max 100MB)
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 rounded-xl hover:from-gray-700 hover:to-gray-800 font-medium flex items-center mx-auto">
            <Upload className="w-5 h-5 mr-2" />
            Select Files
          </button>
        </div>

        {/* Receiver Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Send to (User ID or Username)
          </label>
          <input
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="Enter user ID or username"
            className="input-field"
          />
        </div>

        {/* Message Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message with your files..."
            className="input-field min-h-[100px] resize-none"
            rows="3"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">
                Selected Files ({files.length})
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-red-400 hover:text-red-300 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="space-y-3">
              {files.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="p-4 rounded-xl border border-gray-800/50 bg-gray-900/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gray-800/50">
                        {getFileIcon(fileObj.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-200 truncate">
                          {fileObj.file.name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{formatFileSize(fileObj.file.size)}</span>
                          <span className="capitalize">{fileObj.type}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            fileObj.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            fileObj.status === 'error' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {fileObj.status === 'completed' ? 'Uploaded' :
                             fileObj.status === 'error' ? 'Failed' :
                             'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {fileObj.status === 'uploading' && (
                        <div className="w-24">
                          <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                              style={{ width: `${uploadProgress[fileObj.id] || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 block text-center mt-1">
                            {uploadProgress[fileObj.id] || 0}%
                          </span>
                        </div>
                      )}
                      
                      {fileObj.preview && fileObj.type === 'image' && (
                        <a
                          href={fileObj.preview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-800/50 rounded-lg"
                          title="Preview"
                        >
                          <Image className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                      
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800/50">
          <div className="text-sm text-gray-400">
            {files.length} file{files.length !== 1 ? 's' : ''} selected • 
            Total size: {formatFileSize(files.reduce((acc, file) => acc + file.file.size, 0))}
          </div>
          
          <button
            onClick={uploadFiles}
            disabled={isUploading || files.length === 0 || !receiverId}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
          >
            {isUploading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Upload & Send Files
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;