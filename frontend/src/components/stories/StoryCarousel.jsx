// src/components/stories/StoryCarousel.jsx
import React from 'react';

const StoryCarousel = () => {
  const stories = [
    { id: 1, username: 'User1', image: 'https://picsum.photos/100', hasNew: true },
    { id: 2, username: 'User2', image: 'https://picsum.photos/101' },
    { id: 3, username: 'User3', image: 'https://picsum.photos/102', hasNew: true },
    { id: 4, username: 'User4', image: 'https://picsum.photos/103' },
    { id: 5, username: 'User5', image: 'https://picsum.photos/104' },
    { id: 6, username: 'User6', image: 'https://picsum.photos/105' },
    { id: 7, username: 'User7', image: 'https://picsum.photos/106', hasNew: true },
  ];

  return (
    <div className="flex space-x-4 p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-md overflow-x-auto">
      {/* Add Story Button */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="relative w-20 h-20 rounded-full border-4 border-white dark:border-neutral-900 shadow-lg overflow-hidden">
          <button className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">Add Story</span>
      </div>

      {/* Story Items */}
      {stories.map((story) => (
        <div key={story.id} className="flex-shrink-0 flex flex-col items-center">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full p-1 ${story.hasNew ? 'bg-gradient-to-r from-accent-500 to-primary-500' : 'bg-gradient-to-r from-neutral-400 to-neutral-600'}`}>
              <div className="w-full h-full rounded-full border-4 border-white dark:border-neutral-900 overflow-hidden">
                <img
                  src={story.image}
                  alt={story.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {story.hasNew && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white dark:border-neutral-900 animate-ping-subtle" />
            )}
          </div>
          <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-16">
            {story.username}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StoryCarousel;