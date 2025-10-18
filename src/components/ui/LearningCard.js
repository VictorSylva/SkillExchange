import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LearningCard = ({ 
  id,
  title,
  instructor,
  instructorTitle,
  thumbnail,
  thumbnailUrl,
  previewVideoUrl,
  duration,
  students,
  level,
  rating,
  tags = [],
  isStaffPick = false,
  isBookmarked = false,
  isFromConnection = false,
  progress = null, // New prop for progress data
  onBookmark,
  onClick,
  className = ''
}) => {
  const [showPreview, setShowPreview] = useState(false);
  
  // Debug logging for video URLs
  React.useEffect(() => {
    if (previewVideoUrl) {
      console.log('LearningCard - Preview Video URL:', previewVideoUrl);
      console.log('LearningCard - Video type:', 
        previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be') ? 'YouTube' :
        previewVideoUrl.includes('vimeo.com') ? 'Vimeo' : 'Direct Video'
      );
      
      // Debug YouTube URL parsing
      if (previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be')) {
        let videoId = '';
        if (previewVideoUrl.includes('youtu.be/')) {
          videoId = previewVideoUrl.split('youtu.be/')[1].split('?')[0];
        } else if (previewVideoUrl.includes('youtube.com/watch?v=')) {
          videoId = previewVideoUrl.split('v=')[1].split('&')[0];
        } else if (previewVideoUrl.includes('youtube.com/embed/')) {
          videoId = previewVideoUrl.split('embed/')[1].split('?')[0];
        }
        console.log('LearningCard - YouTube Video ID:', videoId);
        console.log('LearningCard - Generated embed URL:', `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`);
      }
    }
  }, [previewVideoUrl]);
  
  return (
    <div 
      className={`group relative bg-white rounded-2xl shadow-soft hover:shadow-large transition-all duration-300 overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isStaffPick && (
          <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Staff Pick
          </span>
        )}
        {isFromConnection && (
          <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Connection
          </span>
        )}
      </div>

      {/* Bookmark Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBookmark && onBookmark(id);
        }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 ${
          isBookmarked 
            ? 'bg-primary-600 text-white' 
            : 'bg-white/80 text-gray-600 hover:bg-primary-600 hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      </button>

      {/* Thumbnail/Video Preview */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {previewVideoUrl ? (
          // Show clickable video preview
          <div className="w-full h-full relative">
            {previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be') ? (
              // YouTube thumbnail with play button
              <div 
                className="w-full h-full relative bg-gray-900 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
              >
                <img 
                  src={`https://img.youtube.com/vi/${previewVideoUrl.includes('youtu.be/') ? previewVideoUrl.split('youtu.be/')[1].split('?')[0] : previewVideoUrl.split('v=')[1].split('&')[0]}/maxresdefault.jpg`}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Watch on YouTube
                </div>
              </div>
            ) : previewVideoUrl.includes('vimeo.com') ? (
              // Vimeo thumbnail with play button
              <div 
                className="w-full h-full relative bg-gray-900 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
              >
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-sm">Vimeo Video</p>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Watch on Vimeo
                </div>
              </div>
            ) : (
              // Direct video file with thumbnail
              <div 
                className="w-full h-full relative bg-gray-900 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
              >
                <video
                  src={previewVideoUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  poster={thumbnail || thumbnailUrl}
                  onError={(e) => {
                    console.error('Video load error in card:', e);
                    console.error('Video URL:', previewVideoUrl);
                    console.error('Video element:', e.target);
                    
                    // Show error overlay
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center text-white';
                    errorOverlay.innerHTML = `
                      <div class="text-center">
                        <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-sm">Video Error</p>
                        <button onclick="window.open('${previewVideoUrl}', '_blank')" class="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                          Try in New Tab
                        </button>
                      </div>
                    `;
                    e.target.parentNode.appendChild(errorOverlay);
                  }}
                >
                  <source src={previewVideoUrl} type="video/mp4" />
                  <source src={previewVideoUrl} type="video/webm" />
                  <source src={previewVideoUrl} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-30 transition-colors">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                
                {/* Video type indicator */}
                <div className="absolute bottom-2 left-2 bg-gray-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Preview Video
                </div>
              </div>
            )}
          </div>
        ) : thumbnail || thumbnailUrl ? (
          // Show image thumbnail
          <img 
            src={thumbnail || thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // Show default placeholder
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-primary-700 font-medium text-sm">Learn {title.split(' ')[0]}</p>
            </div>
          </div>
        )}
        
        {/* View Course Overlay - show on hover if onClick is provided and no preview video */}
        {onClick && !previewVideoUrl && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-2">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">View Course</span>
          </div>
        )}
        
        {/* Play Button Overlay - only show if no video preview and no onClick */}
        {!previewVideoUrl && !onClick && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Instructor Info */}
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <span className="text-gray-600 font-semibold text-sm">
              {instructor?.charAt(0) || 'I'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {instructor}
            </p>
            {instructorTitle && (
              <p className="text-xs text-gray-500 truncate">
                {instructorTitle}
              </p>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
          {title}
        </h3>

        {/* Progress Indicator */}
        {progress && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Your Progress</span>
              <span>{progress.percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress.percentage || 0}%` }}
              />
            </div>
            {progress.isCompleted && (
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Completed</span>
              </div>
            )}
          </div>
        )}

        {/* Rating and Reviews */}
        {rating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">{rating}</span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {level && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                {level}
              </span>
            )}
            {students && (
              <span>{students} students</span>
            )}
          </div>
          {duration && (
            <span>{duration}</span>
          )}
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary-200 transition-colors duration-300 pointer-events-none"></div>

      {/* Preview Video Modal */}
      {showPreview && previewVideoUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Content */}
            <div className="aspect-video">
              {previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={(() => {
                    // Extract video ID from various YouTube URL formats
                    let videoId = '';
                    if (previewVideoUrl.includes('youtu.be/')) {
                      videoId = previewVideoUrl.split('youtu.be/')[1].split('?')[0];
                    } else if (previewVideoUrl.includes('youtube.com/watch?v=')) {
                      videoId = previewVideoUrl.split('v=')[1].split('&')[0];
                    } else if (previewVideoUrl.includes('youtube.com/embed/')) {
                      videoId = previewVideoUrl.split('embed/')[1].split('?')[0];
                    }
                    
                    // Create proper embed URL
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
                  })()}
                  title={`${title} - Preview`}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onError={(e) => {
                    console.error('YouTube iframe error:', e);
                    // Show fallback option
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-600';
                    errorDiv.innerHTML = `
                      <div class="text-center">
                        <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-sm">YouTube video failed to load</p>
                        <button onclick="window.open('${previewVideoUrl}', '_blank')" class="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                          Watch on YouTube
                        </button>
                      </div>
                    `;
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                />
              ) : previewVideoUrl.includes('vimeo.com') ? (
                <iframe
                  src={(() => {
                    // Extract video ID from Vimeo URL
                    let videoId = '';
                    if (previewVideoUrl.includes('vimeo.com/')) {
                      videoId = previewVideoUrl.split('vimeo.com/')[1].split('?')[0];
                    }
                    return `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;
                  })()}
                  title={`${title} - Preview`}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  onError={(e) => {
                    console.error('Vimeo iframe error:', e);
                    // Show fallback option
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-600';
                    errorDiv.innerHTML = `
                      <div class="text-center">
                        <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-sm">Vimeo video failed to load</p>
                        <button onclick="window.open('${previewVideoUrl}', '_blank')" class="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                          Watch on Vimeo
                        </button>
                      </div>
                    `;
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-black rounded-lg overflow-hidden">
                  <video
                    src={previewVideoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    poster={thumbnail || thumbnailUrl}
                    onError={(e) => {
                      console.error('Video load error:', e);
                      console.error('Video URL:', previewVideoUrl);
                      console.error('Video element:', e.target);
                      
                      // Hide the video and show error message
                      e.target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-600';
                      errorDiv.innerHTML = `
                        <div class="text-center">
                          <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <p class="text-sm">Video format not supported</p>
                          <p class="text-xs text-gray-500 mt-1">Try uploading MP4, WebM, or OGG format</p>
                          <button onclick="window.open('${previewVideoUrl}', '_blank')" class="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                            Open in New Tab
                          </button>
                          <p class="text-xs text-gray-400 mt-2">URL: ${previewVideoUrl}</p>
                        </div>
                      `;
                      e.target.parentNode.appendChild(errorDiv);
                    }}
                  >
                    <source src={previewVideoUrl} type="video/mp4" />
                    <source src={previewVideoUrl} type="video/webm" />
                    <source src={previewVideoUrl} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">Preview Video</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningCard;
