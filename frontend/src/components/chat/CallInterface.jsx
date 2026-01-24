// File: src/components/chat/CallInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Phone, Video, PhoneOff, Mic, MicOff, Video as VideoIcon, 
  VideoOff, Volume2, VolumeX, Maximize2, Minimize2, Settings,
  User, ScreenShare, StopCircle, MessageSquare, Users
} from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const CallInterface = ({ callId, receiverId, receiverName, type = 'audio', onCallEnd }) => {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const [callStatus, setCallStatus] = useState('connecting');
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [callQuality, setCallQuality] = useState('good');
    const [participants, setParticipants] = useState([]);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);
    const statsIntervalRef = useRef(null);

    // WebRTC configuration
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10,
    };

    // Initialize call
    const initializeCall = useCallback(async () => {
        try {
            console.log('🎬 Initializing call...');
            
            // Get local media stream
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: type === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create peer connection
            peerConnectionRef.current = new RTCPeerConnection(configuration);

            // Add local stream tracks to connection
            stream.getTracks().forEach(track => {
                peerConnectionRef.current.addTrack(track, stream);
            });

            // Setup remote stream
            peerConnectionRef.current.ontrack = (event) => {
                console.log('📹 Remote track received');
                const [remoteStream] = event.streams;
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            };

            // Handle ICE candidates
            peerConnectionRef.current.onicecandidate = (event) => {
                if (event.candidate && socket && isConnected) {
                    socket.emit('webrtc-ice-candidate', {
                        callId,
                        candidate: event.candidate,
                        targetUserId: receiverId
                    });
                }
            };

            // Handle connection state changes
            peerConnectionRef.current.onconnectionstatechange = () => {
                const state = peerConnectionRef.current.connectionState;
                console.log('🔗 Connection state:', state);
                
                if (state === 'connected') {
                    setCallStatus('connected');
                    startTimer();
                    startStatsMonitoring();
                    toast.success('Call connected! 🎉', {
                        icon: '✅',
                        style: {
                            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                            color: 'white',
                        },
                    });
                } else if (state === 'disconnected' || state === 'failed') {
                    toast.error('Call disconnected', {
                        icon: '❌',
                    });
                    endCall();
                }
            };

            // Handle ICE connection state
            peerConnectionRef.current.oniceconnectionstatechange = () => {
                const state = peerConnectionRef.current.iceConnectionState;
                console.log('🧊 ICE connection state:', state);
                
                if (state === 'connected' || state === 'completed') {
                    setCallQuality('excellent');
                } else if (state === 'disconnected') {
                    setCallQuality('poor');
                    toast.warning('Poor connection quality', {
                        icon: '⚠️',
                    });
                }
            };

            // Create and send offer
            if (socket && isConnected) {
                const offer = await peerConnectionRef.current.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: type === 'video',
                });
                
                await peerConnectionRef.current.setLocalDescription(offer);
                
                socket.emit('webrtc-signal', {
                    callId,
                    signal: offer,
                    targetUserId: receiverId,
                    type: 'offer'
                });
                
                console.log('📤 Offer sent');
            }

        } catch (error) {
            console.error('❌ Error initializing call:', error);
            
            if (error.name === 'NotAllowedError') {
                toast.error('Microphone/camera access was denied', {
                    icon: '🚫',
                });
            } else if (error.name === 'NotFoundError') {
                toast.error('No microphone/camera found', {
                    icon: '📷',
                });
            } else {
                toast.error('Failed to start call', {
                    icon: '❌',
                });
            }
            
            endCall();
        }
    }, [callId, receiverId, socket, isConnected, type]);

    // Start screen sharing
    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            setScreenStream(stream);
            setIsScreenSharing(true);
            
            // Replace video track with screen share
            const videoTrack = stream.getVideoTracks()[0];
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(sender => 
                sender.track && sender.track.kind === 'video'
            );
            
            if (videoSender) {
                videoSender.replaceTrack(videoTrack);
            }
            
            // Handle screen share stop
            videoTrack.onended = () => {
                stopScreenShare();
            };
            
            if (screenVideoRef.current) {
                screenVideoRef.current.srcObject = stream;
            }
            
            toast.success('Screen sharing started', {
                icon: '🖥️',
            });
            
        } catch (error) {
            console.error('Screen share error:', error);
            if (error.name !== 'NotAllowedError') {
                toast.error('Failed to start screen sharing', {
                    icon: '❌',
                });
            }
        }
    };

    // Stop screen sharing
    const stopScreenShare = () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
        
        setIsScreenSharing(false);
        
        // Restore camera track
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(sender => 
                sender.track && sender.track.kind === 'video'
            );
            
            if (videoSender && videoTrack) {
                videoSender.replaceTrack(videoTrack);
            }
        }
        
        if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = null;
        }
    };

    // Start timer
    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    // Monitor call stats
    const startStatsMonitoring = () => {
        statsIntervalRef.current = setInterval(async () => {
            if (!peerConnectionRef.current) return;
            
            try {
                const stats = await peerConnectionRef.current.getStats();
                let audioBytesReceived = 0;
                let videoBytesReceived = 0;
                
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp') {
                        if (report.mediaType === 'audio') {
                            audioBytesReceived += report.bytesReceived || 0;
                        } else if (report.mediaType === 'video') {
                            videoBytesReceived += report.bytesReceived || 0;
                        }
                    }
                });
                
                // Update call quality based on stats
                const totalBytes = audioBytesReceived + videoBytesReceived;
                if (totalBytes < 10000) {
                    setCallQuality('poor');
                } else if (totalBytes < 50000) {
                    setCallQuality('fair');
                } else {
                    setCallQuality('good');
                }
            } catch (error) {
                console.error('Stats monitoring error:', error);
            }
        }, 5000);
    };

    // Format duration
    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle mute
    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                
                toast[audioTrack.enabled ? 'success' : 'info'](
                    audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted',
                    { icon: audioTrack.enabled ? '🎤' : '🔇' }
                );
            }
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream && type === 'video') {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                
                toast[videoTrack.enabled ? 'success' : 'info'](
                    videoTrack.enabled ? 'Camera turned on' : 'Camera turned off',
                    { icon: videoTrack.enabled ? '📷' : '📵' }
                );
            }
        }
    };

    // Toggle speaker
    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = !isSpeakerOn;
        }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        const elem = document.documentElement;
        if (!isFullscreen) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // End call
    const endCall = useCallback(() => {
        console.log('📞 Ending call...');
        
        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        // Stop stats monitoring
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
        }
        
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
        }
        
        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        
        // Emit call end event
        if (socket && isConnected && callId) {
            socket.emit('endCall', { callId, duration: callDuration });
        }
        
        // Update UI
        setCallStatus('ended');
        
        toast('Call ended', {
            icon: '📞',
            style: {
                background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                color: 'white',
            },
        });
        
        if (onCallEnd) {
            setTimeout(onCallEnd, 1000);
        }
    }, [localStream, screenStream, remoteStream, socket, isConnected, callId, callDuration, onCallEnd]);

    // Socket event listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleWebRTCSignal = (data) => {
            if (data.callId === callId && peerConnectionRef.current) {
                console.log('📥 Received WebRTC signal:', data.signal.type);
                
                peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal))
                    .then(() => {
                        if (data.signal.type === 'offer') {
                            return peerConnectionRef.current.createAnswer();
                        }
                    })
                    .then(answer => {
                        if (answer) {
                            return peerConnectionRef.current.setLocalDescription(answer);
                        }
                    })
                    .then(() => {
                        if (data.signal.type === 'offer') {
                            socket.emit('webrtc-signal', {
                                callId,
                                signal: peerConnectionRef.current.localDescription,
                                targetUserId: receiverId,
                                type: 'answer'
                            });
                        }
                    })
                    .catch(error => console.error('WebRTC signal error:', error));
            }
        };

        const handleICECandidate = (data) => {
            if (data.callId === callId && peerConnectionRef.current) {
                peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
                    .catch(error => console.error('Error adding ICE candidate:', error));
            }
        };

        socket.on('webrtc-signal', handleWebRTCSignal);
        socket.on('webrtc-ice-candidate', handleICECandidate);
        socket.on('callEnded', (data) => {
            if (data.callId === callId) {
                toast.info(`${receiverName} ended the call`, {
                    icon: '👋',
                });
                endCall();
            }
        });

        return () => {
            socket.off('webrtc-signal', handleWebRTCSignal);
            socket.off('webrtc-ice-candidate', handleICECandidate);
            socket.off('callEnded');
        };
    }, [socket, isConnected, callId, receiverId, receiverName, endCall]);

    // Initialize call when component mounts
    useEffect(() => {
        initializeCall();
        
        // Handle fullscreen change
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
            endCall();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [initializeCall, endCall]);

    // Call quality indicator
    const getQualityIndicator = () => {
        const colors = {
            excellent: 'bg-success-500',
            good: 'bg-success-400',
            fair: 'bg-warning-500',
            poor: 'bg-danger-500',
        };
        
        return (
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${colors[callQuality] || colors.good}`}></div>
                <span className="text-xs capitalize">{callQuality}</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-neutral-900 to-neutral-950 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-black/50 to-transparent">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                        {type === 'video' ? (
                            <Video className="w-5 h-5 text-white" />
                        ) : (
                            <Phone className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            {type === 'video' ? 'Video Call' : 'Voice Call'} with {receiverName}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-neutral-300">
                            <span>{formatDuration(callDuration)}</span>
                            {getQualityIndicator()}
                            <span>{callStatus === 'connected' ? 'Connected' : 'Connecting...'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-white hover:bg-white/10 rounded-full"
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-5 h-5" />
                        ) : (
                            <Maximize2 className="w-5 h-5" />
                        )}
                    </button>
                    <button
                        onClick={toggleSpeaker}
                        className="p-2 text-white hover:bg-white/10 rounded-full"
                    >
                        {isSpeakerOn ? (
                            <Volume2 className="w-5 h-5" />
                        ) : (
                            <VolumeX className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Remote Video */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
                                    <div className="text-4xl text-white font-bold">
                                        {receiverName?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <p className="text-white text-xl font-medium">{receiverName}</p>
                                <p className="text-neutral-400 mt-2">
                                    {callStatus === 'connecting' ? 'Connecting...' : 'Waiting for video'}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Remote user info overlay */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                        <p className="text-white text-sm font-medium">{receiverName}</p>
                    </div>
                    
                    {/* Screen share indicator */}
                    {isScreenSharing && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-accent-500 to-warning-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Screen Sharing
                        </div>
                    )}
                </div>

                {/* Local Video & Screen Share */}
                <div className="space-y-4">
                    {/* Local Video */}
                    {type === 'video' && localStream && (
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 aspect-video">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                                <p className="text-white text-sm font-medium">You</p>
                            </div>
                            {isVideoOff && (
                                <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <VideoOff className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                                        <p className="text-neutral-400 text-sm">Camera off</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Screen Share Preview */}
                    {isScreenSharing && (
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 aspect-video">
                            <video
                                ref={screenVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                                <p className="text-white text-sm font-medium">Your Screen</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Call Controls */}
            <div className="p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex justify-center items-center space-x-6">
                    {/* Mute toggle */}
                    <button
                        onClick={toggleMute}
                        className={`flex flex-col items-center group ${isMuted ? 'text-danger-500' : 'text-white'}`}
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                            isMuted 
                                ? 'bg-danger-500/20 hover:bg-danger-500/30' 
                                : 'bg-white/10 hover:bg-white/20'
                        }`}>
                            {isMuted ? (
                                <MicOff className="w-6 h-6" />
                            ) : (
                                <Mic className="w-6 h-6" />
                            )}
                        </div>
                        <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>

                    {/* Video toggle (only for video calls) */}
                    {type === 'video' && (
                        <button
                            onClick={toggleVideo}
                            className={`flex flex-col items-center group ${isVideoOff ? 'text-warning-500' : 'text-white'}`}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                                isVideoOff 
                                    ? 'bg-warning-500/20 hover:bg-warning-500/30' 
                                    : 'bg-white/10 hover:bg-white/20'
                            }`}>
                                {isVideoOff ? (
                                    <VideoOff className="w-6 h-6" />
                                ) : (
                                    <VideoIcon className="w-6 h-6" />
                                )}
                            </div>
                            <span className="text-xs">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
                        </button>
                    )}

                    {/* Screen share toggle */}
                    {type === 'video' && (
                        <button
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            className={`flex flex-col items-center group ${isScreenSharing ? 'text-accent-500' : 'text-white'}`}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                                isScreenSharing 
                                    ? 'bg-accent-500/20 hover:bg-accent-500/30' 
                                    : 'bg-white/10 hover:bg-white/20'
                            }`}>
                                {isScreenSharing ? (
                                    <StopCircle className="w-6 h-6" />
                                ) : (
                                    <ScreenShare className="w-6 h-6" />
                                )}
                            </div>
                            <span className="text-xs">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                        </button>
                    )}

                    {/* End call */}
                    <button
                        onClick={endCall}
                        className="flex flex-col items-center group"
                    >
                        <div className="w-16 h-16 bg-gradient-to-r from-danger-500 to-danger-600 rounded-full flex items-center justify-center mb-2 hover:from-danger-600 hover:to-danger-700 transition-all duration-300 transform hover:scale-105">
                            <PhoneOff className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-xs text-danger-400">End Call</span>
                    </button>
                </div>

                {/* Additional controls */}
                <div className="flex justify-center space-x-4 mt-4">
                    <button className="text-white text-sm hover:text-primary-300 transition-colors">
                        <Settings className="w-4 h-4 inline mr-1" />
                        Settings
                    </button>
                    <button className="text-white text-sm hover:text-primary-300 transition-colors">
                        <Users className="w-4 h-4 inline mr-1" />
                        Participants
                    </button>
                    <button className="text-white text-sm hover:text-primary-300 transition-colors">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallInterface;