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

  // For all other URLs (including Cloudinary, Vimeo, direct video files), use ReactPlayer
  return (
    <ReactPlayer
      url={url}
      width="100%"
      height="100%"
      playing={autoplay}
      controls={true}
      className={className}
      config={{
        file: {
          attributes: {
            controlsList: 'nodownload',
            disablePictureInPicture: true
          }
        }
      }}
    />
  );
};

VideoPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  className: PropTypes.string,
  autoplay: PropTypes.bool,
  opts: PropTypes.object
};

export default VideoPlayer;