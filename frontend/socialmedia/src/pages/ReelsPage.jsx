import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaComment, FaShare, FaMusic, FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const ReelsPage = () => {
    const { user } = useAuth();
    const [reels, setReels] = useState([
        {
            id: 1,
            user: { username: 'dancer1', profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg' },
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-in-the-club-3989-large.mp4',
            caption: 'Friday night vibes! 🎵',
            likes: 1245,
            comments: 89,
            shares: 45,
            music: 'Trending Sound',
        },
        {
            id: 2,
            user: { username: 'comedian', profilePicture: 'https://randomuser.me/api/portraits/men/2.jpg' },
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-funny-cat-lying-on-a-table-3902-large.mp4',
            caption: 'When you try to be productive 😂',
            likes: 2345,
            comments: 156,
            shares: 89,
            music: 'Funny Moments',
        },
    ]);
    const [currentReel, setCurrentReel] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [liked, setLiked] = useState([]);
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentReel]);

    const handleLike = (reelId) => {
        if (liked.includes(reelId)) {
            setLiked(liked.filter(id => id !== reelId));
            setReels(prev => prev.map(reel =>
                reel.id === reelId ? { ...reel, likes: reel.likes - 1 } : reel
            ));
        } else {
            setLiked([...liked, reelId]);
            setReels(prev => prev.map(reel =>
                reel.id === reelId ? { ...reel, likes: reel.likes + 1 } : reel
            ));
        }
    };

    const handleNext = () => {
        setCurrentReel((prev) => (prev + 1) % reels.length);
        setIsPlaying(true);
    };

    const handlePrev = () => {
        setCurrentReel((prev) => (prev - 1 + reels.length) % reels.length);
        setIsPlaying(true);
    };

    const reel = reels[currentReel];

    return (
        <div className="fixed inset-0 bg-black">
            {/* Video Player */}
            <div className="relative h-full">
                <video
                    ref={videoRef}
                    src={reel.videoUrl}
                    className="w-full h-full object-contain"
                    loop
                    muted={isMuted}
                    onClick={() => setIsPlaying(!isPlaying)}
                />

                {/* Play/Pause Overlay */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="bg-black bg-opacity-50 text-white p-6 rounded-full"
                        >
                            <FaPlay className="text-3xl" />
                        </button>
                    </div>
                )}

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                    <h1 className="text-white text-xl font-bold">Reels</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-white"
                        >
                            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>
                        <button className="text-white">
                            <FaMusic />
                        </button>
                    </div>
                </div>

                {/* Side Controls */}
                <div className="absolute right-4 bottom-1/4 flex flex-col items-center space-y-6">
                    <button
                        onClick={() => handleLike(reel.id)}
                        className="flex flex-col items-center text-white"
                    >
                        <FaHeart className={`text-2xl ${liked.includes(reel.id) ? 'text-red-500' : ''}`} />
                        <span className="text-sm">{reel.likes}</span>
                    </button>
                    <button className="flex flex-col items-center text-white">
                        <FaComment className="text-2xl" />
                        <span className="text-sm">{reel.comments}</span>
                    </button>
                    <button className="flex flex-col items-center text-white">
                        <FaShare className="text-2xl" />
                        <span className="text-sm">{reel.shares}</span>
                    </button>
                </div>

                {/* User Info & Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center space-x-3 mb-3">
                        <img
                            src={reel.user.profilePicture}
                            alt={reel.user.username}
                            className="w-10 h-10 rounded-full border-2 border-white"
                        />
                        <div>
                            <h3 className="text-white font-semibold">{reel.user.username}</h3>
                            <p className="text-gray-300 text-sm">Follow</p>
                        </div>
                    </div>
                    <p className="text-white mb-2">{reel.caption}</p>
                    <div className="flex items-center space-x-2 text-gray-300">
                        <FaMusic />
                        <span className="text-sm">{reel.music}</span>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-3 rounded-full"
                >
                    ↑
                </button>
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-3 rounded-full"
                >
                    ↓
                </button>
            </div>
        </div>
    );
};

export default ReelsPage;