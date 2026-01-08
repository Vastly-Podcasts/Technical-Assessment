import React, { forwardRef } from 'react';

interface VideoPlayerProps {
  src: string;
  onLoadedMetadata?: () => void;
  crossOrigin?: "anonymous" | "use-credentials";
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onLoadedMetadata, crossOrigin }, ref) => {
    return (
      <video
        ref={ref}
        src={src}
        className="video-player"
        controls
        muted
        crossOrigin = {crossOrigin}
        onLoadedMetadata={onLoadedMetadata}
      />
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer; 