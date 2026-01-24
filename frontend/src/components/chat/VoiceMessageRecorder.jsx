import React, { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';
import { uploadVoiceMessage } from '../../services/chat.service';

const VoiceMessageRecorder = ({ onRecordingComplete, receiverId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendVoiceMessage(audioBlob);
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
            alert('Microphone access denied or not available');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const sendVoiceMessage = async (audioBlob) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('voice', audioBlob);
            formData.append('receiverId', receiverId);
            formData.append('duration', recordingTime);

            await uploadVoiceMessage(formData);
            
            if (onRecordingComplete) {
                onRecordingComplete();
            }
        } catch (error) {
            console.error('Error uploading voice message:', error);
        } finally {
            setIsUploading(false);
            setRecordingTime(0);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center space-x-3">
            {isRecording ? (
                <>
                    <button
                        onClick={stopRecording}
                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"
                        disabled={isUploading}
                    >
                        <Square className="w-6 h-6" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-500 font-medium">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                </>
            ) : (
                <button
                    onClick={startRecording}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader className="w-6 h-6 animate-spin" />
                    ) : (
                        <Mic className="w-6 h-6" />
                    )}
                </button>
            )}
        </div>
    );
};

export default VoiceMessageRecorder;