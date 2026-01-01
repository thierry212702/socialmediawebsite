import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';  // Changed from '../'
import { useSocket } from '../context/SocketContext';  // Changed from '../'
import { chatAPI } from "../utils/api";
import { FaSearch, FaPaperPlane, FaImage, FaSmile, FaEllipsisV, FaCheck, FaCheckDouble } from 'react-icons/fa';

const ChatPage = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (socket && selectedConversation) {
            socket.on('newMessage', handleNewMessage);
            return () => {
                socket.off('newMessage', handleNewMessage);
            };
        }
    }, [socket, selectedConversation]);

    const fetchConversations = async () => {
        try {
            const response = await chatAPI.getConversations();
            if (response.data.success) {
                setConversations(response.data.conversations || []);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversation) => {
        try {
            const otherParticipant = conversation.participants.find(p => p._id !== user._id);
            if (!otherParticipant) return;

            const response = await chatAPI.getMessages(otherParticipant._id);
            if (response.data.success) {
                setMessages(response.data.messages || []);
                setSelectedConversation(conversation);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleNewMessage = (message) => {
        if (selectedConversation &&
            (message.senderId._id === selectedConversation.participants.find(p => p._id !== user._id)?._id ||
                message.receiverId._id === selectedConversation.participants.find(p => p._id !== user._id)?._id)) {
            setMessages(prev => [...prev, message]);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const otherParticipant = selectedConversation.participants.find(p => p._id !== user._id);
        if (!otherParticipant) return;

        try {
            const messageData = {
                senderId: user._id,
                receiverId: otherParticipant._id,
                text: newMessage,
            };

            // Send via socket if available
            if (socket) {
                socket.emit('sendMessage', messageData);
            }

            // Also send via API
            await chatAPI.sendMessage(otherParticipant._id, { text: newMessage });

            // Add message to UI immediately
            const tempMessage = {
                _id: Date.now().toString(),
                senderId: { _id: user._id, username: user.username, profilePicture: user.profilePicture },
                receiverId: { _id: otherParticipant._id, username: otherParticipant.username },
                text: newMessage,
                createdAt: new Date().toISOString(),
            };

            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex h-[600px]">
                {/* Conversations Sidebar */}
                <div className="w-1/3 border-r border-border-color">
                    <div className="p-4 border-b border-border-color">
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                        <div className="relative mt-4">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto h-[calc(600px-80px)]">
                        {conversations.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map(conversation => {
                                const otherParticipant = conversation.participants.find(p => p._id !== user._id);
                                if (!otherParticipant) return null;

                                return (
                                    <div
                                        key={conversation._id}
                                        onClick={() => fetchMessages(conversation)}
                                        className={`p-4 border-b border-border-color cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?._id === conversation._id ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={otherParticipant.profilePicture || '/default-avatar.png'}
                                                alt={otherParticipant.username}
                                                className="w-12 h-12 rounded-full"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-semibold truncate">{otherParticipant.username}</h4>
                                                    <span className="text-xs text-gray-500">
                                                        {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {conversation.lastMessage?.text || 'Start a conversation'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="w-2/3 flex flex-col">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border-color flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={selectedConversation.participants.find(p => p._id !== user._id)?.profilePicture || '/default-avatar.png'}
                                        alt="User"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <h3 className="font-semibold">
                                            {selectedConversation.participants.find(p => p._id !== user._id)?.username}
                                        </h3>
                                        <p className="text-sm text-gray-500">Online</p>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-gray-700">
                                    <FaEllipsisV />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map(message => {
                                        const isOwnMessage = message.senderId._id === user._id;
                                        return (
                                            <div
                                                key={message._id}
                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage
                                                        ? 'bg-primary text-white rounded-br-none'
                                                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                                        }`}
                                                >
                                                    <p>{message.text}</p>
                                                    <div className={`text-xs mt-1 flex items-center space-x-1 ${isOwnMessage ? 'text-white/80' : 'text-gray-500'
                                                        }`}>
                                                        <span>{formatTime(message.createdAt)}</span>
                                                        {isOwnMessage && (
                                                            <>
                                                                <FaCheck />
                                                                <FaCheckDouble className="text-blue-300" />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Message Input */}
                            <form onSubmit={sendMessage} className="p-4 border-t border-border-color">
                                <div className="flex items-center space-x-2">
                                    <button type="button" className="text-gray-500 hover:text-gray-700">
                                        <FaImage />
                                    </button>
                                    <button type="button" className="text-gray-500 hover:text-gray-700">
                                        <FaSmile />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 border border-border-color rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaPaperPlane />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">💬</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Messages</h3>
                                <p className="text-gray-500">Select a conversation to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;