import ReactPlayer from 'react-player';
import YouTube from 'react-youtube';
import PropTypes from 'prop-types';

const VideoPlayer = ({ url, className = 'w-full aspect-video', autoplay = false, opts = {} }) => {
  // Function to determine if URL is a YouTube URL
  const isYouTubeUrl = (videoUrl) => {
    return videoUrl && (
      videoUrl.includes('youtube.com') || 
      videoUrl.includes('youtu.be') || 
      videoUrl.includes('youtube-nocookie.com')
    );
  };

  // Function to check if URL is a Cloudinary video
  const isCloudinaryUrl = (videoUrl) => {
    return videoUrl && videoUrl.includes('cloudinary.com');
  };

  // Function to extract YouTube video ID
  const getYouTubeVideoId = (videoUrl) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = videoUrl.match(regex);
    return match ? match[1] : null;
  };

  // If it's a YouTube URL, use the YouTube component
  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      const youtubeOpts = {
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          ...opts.playerVars
        },
        ...opts
      };
      return (
        <YouTube 
          videoId={videoId} 
          opts={youtubeOpts} 
          iframeClassName={className}
        />
      );
    }
  }

  // For Cloudinary videos, use native HTML5 video player for better compatibility
  if (isCloudinaryUrl(url)) {
    return (
      <div className={className}>
        <video
          src={url}
          controls
          autoPlay={autoplay}
          className="w-full h-full"
          controlsList="nodownload"
          preload="auto"
          style={{ objectFit: 'contain' }}
          onError={(e) => {
            console.error('Video playback error:', e);
            console.error('Video URL:', url);
          }}
          onLoadStart={() => console.log('Video loading started:', url)}
          onCanPlay={() => console.log('Video can play:', url)}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // For all other URLs (Vimeo, direct video files, etc.), use ReactPlayer
  return (
    <div className={className}>
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        playing={autoplay}
        controls={true}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
              disablePictureInPicture: true,
              crossOrigin: 'anonymous'
            }
          }
        }}
      />
    </div>
  );
};

VideoPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  className: PropTypes.string,
  autoplay: PropTypes.bool,
  opts: PropTypes.object
};

export default VideoPlayer;