import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Play, Pause, Trash2, Loader, Clock, Download, Share2 } from 'lucide-react';
import { uploadVoiceMessage } from '../../services/chat.service';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const VoiceMessage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [receiverId, setReceiverId] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const { user } = useAuth();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newRecording = {
          id: Date.now(),
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          timestamp: new Date().toISOString()
        };
        
        setRecordings(prev => [newRecording, ...prev]);
        setSelectedRecording(newRecording);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const sendVoiceMessage = async () => {
    if (!selectedRecording || !receiverId) {
      toast.error('Please select a recording and receiver');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('voice', selectedRecording.blob);
      formData.append('receiverId', receiverId);
      formData.append('duration', selectedRecording.duration);
      formData.append('timestamp', selectedRecording.timestamp);

      await uploadVoiceMessage(formData);
      toast.success('Voice message sent!');
      
      // Remove sent recording
      setRecordings(prev => prev.filter(r => r.id !== selectedRecording.id));
      setSelectedRecording(null);
      
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRecording = (id) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
    if (selectedRecording?.id === id) {
      setSelectedRecording(null);
    }
  };

  const downloadRecording = (recording) => {
    const link = document.createElement('a');
    link.href = recording.url;
    link.download = `voice_message_${new Date(recording.timestamp).toISOString().split('T')[0]}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2 gradient-text">Voice Messages</h1>
        <p className="text-gray-400 mb-6">Record and send voice messages to your friends</p>

        {/* Recording Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Record New Message</h3>
              <p className="text-sm text-gray-400">Click the microphone to start recording</p>
            </div>
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-400 animate-pulse">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center mb-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-6 rounded-full transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500/20 border-red-500/50'
                  : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 hover:from-blue-600/30 hover:to-purple-600/30'
              } border-2`}
            >
              {isRecording ? (
                <Square className="w-10 h-10 text-red-400" />
              ) : (
                <Mic className="w-10 h-10 text-blue-400" />
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              {isRecording ? 'Recording... Click to stop' : 'Click microphone to start recording'}
            </p>
          </div>
        </div>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Your Recordings</h3>
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    selectedRecording?.id === recording.id
                      ? 'bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/50'
                      : 'bg-gray-900/30 border-gray-800/50 hover:bg-gray-800/30'
                  }`}
                  onClick={() => setSelectedRecording(recording)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50"
                      >
                        {isPlaying && selectedRecording?.id === recording.id ? (
                          <Pause className="w-5 h-5 text-gray-300" />
                        ) : (
                          <Play className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                      <div>
                        <p className="font-medium text-gray-200">
                          Voice Message {formatTime(recording.duration)}
                        </p>
                        <p className="text-sm text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(recording.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadRecording(recording);
                        }}
                        className="p-2 hover:bg-gray-800/50 rounded-lg"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecording(recording.id);
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Section */}
        {selectedRecording && (
          <div className="p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-800/50">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Send Voice Message</h3>
            
            <div className="mb-6">
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-gray-300" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-300" />
                  )}
                </button>
                <div>
                  <p className="text-gray-200">Selected Recording</p>
                  <p className="text-sm text-gray-400">{formatTime(selectedRecording.duration)}</p>
                </div>
              </div>
              
              <button
                onClick={sendVoiceMessage}
                disabled={isUploading || !receiverId}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Voice Message
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Audio Player (hidden) */}
        <audio
          ref={audioRef}
          src={selectedRecording?.url}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default VoiceMessage;