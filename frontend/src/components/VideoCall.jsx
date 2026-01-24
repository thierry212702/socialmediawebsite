import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Users, ScreenShare, StopCircle, MessageSquare, MoreVertical } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const VideoCall = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const timerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  const initializeMedia = async () => {
    try {
      const constraints = {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      if (screenShareRef.current) {
        screenShareRef.current.srcObject = screenStream;
      }

      // Replace video track in peer connection
      if (peerConnectionRef.current) {
        const screenTrack = screenStream.getVideoTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      }

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    setIsScreenSharing(false);
    
    // Restore camera video
    if (localStreamRef.current && peerConnectionRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack);
      }
    }
    
    if (screenShareRef.current) {
      screenShareRef.current.srcObject = null;
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        if (socket) {
          socket.emit('callControl', {
            action: 'mute',
            muted: !audioTrack.enabled
          });
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        
        if (socket) {
          socket.emit('callControl', {
            action: 'video',
            enabled: videoTrack.enabled
          });
        }
      }
    }
  };

  const startCall = async () => {
    try {
      setCallStatus('calling');
      
      const stream = await initializeMedia();
      await createPeerConnection(stream);
      
      // Start call via socket
      if (socket) {
        socket.emit('startCall', {
          type: 'video',
          participants: participants.map(p => p.id)
        });
      }

    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('idle');
    }
  };

  const createPeerConnection = async (stream) => {
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    // Add local stream tracks
    stream.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, stream);
    });

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // ICE candidate handling
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', {
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current.connectionState;
      console.log('Connection state:', state);
      
      if (state === 'connected') {
        setCallStatus('connected');
        startTimer();
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        endCall();
      }
    };
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const endCall = () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Emit call end event
    if (socket) {
      socket.emit('endCall');
    }

    // Reset state
    setCallStatus('ended');
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOn(true);
    setIsScreenSharing(false);
    
    setTimeout(() => {
      setCallStatus('idle');
    }, 2000);
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('incomingCall', (data) => {
      // Handle incoming call
      console.log('Incoming call:', data);
    });

    socket.on('callAccepted', (data) => {
      setCallStatus('connected');
    });

    socket.on('callDeclined', () => {
      setCallStatus('ended');
    });

    socket.on('callEnded', () => {
      endCall();
    });

    socket.on('participantJoined', (participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    socket.on('participantLeft', (participantId) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('callDeclined');
      socket.off('callEnded');
      socket.off('participantJoined');
      socket.off('participantLeft');
    };
  }, [socket]);

  if (callStatus === 'ended') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
            <PhoneOff className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Call Ended</h2>
          <p className="text-gray-400 mb-6">Duration: {formatDuration(callDuration)}</p>
          <button
            onClick={() => setCallStatus('idle')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
          >
            Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Main Video Grid */}
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Remote Video */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gray-900">
          {remoteVideoRef.current?.srcObject ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-16 h-16 text-gray-600" />
                </div>
                <p className="text-xl text-gray-400">Waiting for participants...</p>
              </div>
            </div>
          )}
          
          {/* Call Status Overlay */}
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  {callStatus === 'calling' && 'Calling...'}
                  {callStatus === 'ringing' && 'Ringing...'}
                </div>
                <div className="text-3xl text-white font-bold">
                  {formatDuration(callDuration)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="flex flex-col space-y-4">
          {/* Local Video */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 flex-1">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm">
              You {isMuted ? '(Muted)' : ''}
            </div>
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>

          {/* Screen Share Preview */}
          {isScreenSharing && (
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 flex-1">
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm">
                Screen Sharing
              </div>
            </div>
          )}

          {/* Participants List */}
          {showParticipants && (
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="font-medium text-gray-300 mb-3">Participants ({participants.length + 1})</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                    {user?.username?.charAt(0) || 'Y'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">You {isMuted && '(Muted)'}</p>
                  </div>
                </div>
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/50">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">{participant.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 flex-1">
              <h3 className="font-medium text-gray-300 mb-3">Chat</h3>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p>Chat during call</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4 bg-gray-900/80 backdrop-blur-xl rounded-2xl px-6 py-4 border border-gray-800/50 shadow-2xl">
          {/* Duration */}
          <div className="text-white font-mono text-lg mr-4">
            {formatDuration(callDuration)}
          </div>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-all duration-300 ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all duration-300 ${
              !isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {isVideoOn ? (
              <VideoIcon className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-3 rounded-full transition-all duration-300 ${
              isScreenSharing ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {isScreenSharing ? (
              <StopCircle className="w-6 h-6" />
            ) : (
              <ScreenShare className="w-6 h-6" />
            )}
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-3 rounded-full transition-all duration-300 ${
              showParticipants ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Users className="w-6 h-6" />
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all duration-300 ${
              showChat ? 'bg-green-500/20 text-green-400' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <MessageSquare className="w-6 h-6" />
          </button>

          {/* More Options */}
          <button className="p-3 rounded-full bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition-colors">
            <MoreVertical className="w-6 h-6" />
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors ml-4"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Start Call Button (when idle) */}
      {callStatus === 'idle' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
              <Video className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Start Video Call</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start a high-quality video call with your friends or colleagues
            </p>
            <div className="space-x-4">
              <button
                onClick={startCall}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium text-lg"
              >
                Start Call
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-8 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;