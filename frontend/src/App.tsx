import React, { useRef, useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import { videoUrl } from './consts';

// Exported to fix the TypeScript error in FaceDetectionOverlay.tsx
export interface FaceDetection {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    label?: string;
}

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  const toggleBackgroundFilter = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsFiltering(true);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.4);

      try {
        const res = await fetch('http://127.0.0.1:8080/process-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await res.json();
        
        if (data.image) {
          setProcessedImage(data.image);
          // Continues the loop for real-time display
          requestAnimationFrame(toggleBackgroundFilter); 
        }
      } catch (error) {
        console.error('Connection lost:', error);
        // If error occurs, we stop filtering to let user try again
        setIsFiltering(false);
        setProcessedImage(null);
      }
    }
  };

  return (
    <div className="container" style={{ padding: '30px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#333' }}>AI Background Filter</h1>
        <p style={{ color: '#666' }}>Real-time person segmentation using MediaPipe & Flask</p>
      </header>
      
      <div style={{ 
        position: 'relative', 
        maxWidth: '720px', 
        margin: '0 auto', 
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '8px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        {/* Simple logic: The <img> simply overlays the <video> when available */}
        <VideoPlayer
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={() => console.log('Video ready')}
        />

        {processedImage && (
          <img 
            src={processedImage} 
            alt="AI Filtered View" 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              zIndex: 10 
            }} 
          />
        )}
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <button 
          onClick={toggleBackgroundFilter}
          className="btn btn-primary"
          disabled={isFiltering}
          style={{ 
            padding: '12px 36px', 
            fontSize: '18px', 
            borderRadius: '4px',
            cursor: isFiltering ? 'default' : 'pointer',
            backgroundColor: isFiltering ? '#6c757d' : '#007bff',
            border: 'none',
            color: 'white'
          }}
        >
          {isFiltering ? 'Filter Active' : 'Add Background Filter'}
        </button>
      </div>
    </div>
  );
};

export default App;