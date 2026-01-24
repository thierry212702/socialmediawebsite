// components/chat/IncomingCallModal.jsx
import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';

const IncomingCallModal = ({ call, onAnswer, onDecline }) => {
    const [callDuration, setCallDuration] = useState(0);
    const [ringtone, setRingtone] = useState(null);

    // Play ringtone
    useEffect(() => {
        const audio = new Audio('/ringtone.mp3'); // You need to add a ringtone.mp3 file to your public folder
        audio.loop = true;
        
        // Try to play ringtone
        const playRingtone = async () => {
            try {
                await audio.play();
                setRingtone(audio);
            } catch (error) {
                console.log('Could not play ringtone:', error);
            }
        };
        
        playRingtone();
        
        return () => {
            if (ringtone) {
                ringtone.pause();
                ringtone.currentTime = 0;
            }
        };
    }, []);

    // Stop ringtone when component unmounts or call is answered/declined
    useEffect(() => {
        return () => {
            if (ringtone) {
                ringtone.pause();
                ringtone.currentTime = 0;
            }
        };
    }, [ringtone]);

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get caller info
    const callerName = call?.callerName || call?.call?.callerId?.username || 'Unknown';
    const callerAvatar = call?.call?.callerId?.profilePicture || null;
    const callType = call?.type || call?.call?.type || 'audio';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Call header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center">
                    <div className="flex flex-col items-center">
                        {/* Caller avatar */}
                        <div className="relative mb-6">
                            {callerAvatar ? (
                                <img
                                    src={callerAvatar}
                                    alt={callerName}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
                                    <User className="w-16 h-16 text-blue-500" />
                                </div>
                            )}
                            {/* Animated ring */}
                            <div className="absolute inset-0 rounded-full border-4 border-white border-opacity-30 animate-ping"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-white border-opacity-20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                        
                        {/* Caller info */}
                        <h2 className="text-3xl font-bold text-white mb-2">{callerName}</h2>
                        <div className="flex items-center justify-center space-x-2 text-white text-lg">
                            {callType === 'video' ? (
                                <VideoIcon className="w-5 h-5" />
                            ) : (
                                <Phone className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                                {callType === 'video' ? 'Video Call' : 'Audio Call'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Call details */}
                <div className="p-6 text-center">
                    <p className="text-gray-600 text-lg mb-8 animate-pulse">
                        Incoming call...
                    </p>
                    
                    {/* Call duration (if answered) */}
                    {callDuration > 0 && (
                        <div className="mb-6">
                            <p className="text-gray-500 text-sm">Call duration</p>
                            <p className="text-2xl font-bold text-gray-800">{formatDuration(callDuration)}</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-center space-x-6">
                        {/* Decline button */}
                        <button
                            onClick={onDecline}
                            className="flex flex-col items-center group"
                        >
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-2 group-hover:bg-red-600 transition-colors shadow-lg">
                                <PhoneOff className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-sm font-medium text-red-600">Decline</span>
                        </button>

                        {/* Answer button */}
                        <button
                            onClick={onAnswer}
                            className="flex flex-col items-center group"
                        >
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-600 transition-colors shadow-lg animate-pulse">
                                <Phone className="w-10 h-10 text-white" />
                            </div>
                            <span className="text-sm font-medium text-green-600">Answer</span>
                        </button>
                    </div>

                    {/* Additional info */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-gray-500 text-sm">
                            {callType === 'video' 
                                ? 'This call will use your camera and microphone' 
                                : 'This call will use your microphone'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;