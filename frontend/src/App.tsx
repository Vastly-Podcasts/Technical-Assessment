import React, { useRef, useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import { videoUrl } from './consts';
import io from 'socket.io-client';

export interface FaceDetection {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    label?: string;
}

export interface TimelineSegment {
    id: string;
    start: number; // seconds
    end: number;   // seconds
    filter: string;
}

const FILTERS = [
    { id: 'none', name: 'Original' },
    { id: 'black_background', name: 'Black Background' },
    { id: 'blur', name: 'Background Blur' },
    { id: 'sepia', name: 'Sepia Tone' },
    { id: 'grayscale', name: 'Black & White' },
    { id: 'heatmap', name: 'Heatmap' },
    { id: 'canny', name: 'Edge Detection' },
    { id: 'universe', name: 'Universe (BETA)' },
];

const App: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const processedImgRef = useRef<HTMLImageElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [customVideoSrc, setCustomVideoSrc] = useState<string | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [sensitivity, setSensitivity] = useState(0.5);
    
    // Timeline State
    const [timeline, setTimeline] = useState<TimelineSegment[]>([]);
    const [useTimeline, setUseTimeline] = useState(false);
    const [newSegment, setNewSegment] = useState({ start: 0, end: 5, filter: 'universe' });

    const socketRef = useRef<any>(null);
    const processingIntervalRef = useRef<NodeJS.Timer | null>(null);

    // Keep a ref for the selected filter/offsets AND timeline to access inside the interval without closure staleness
    const paramsRef = useRef({ 
        filter: selectedFilter, 
        x: 0, 
        y: 0, 
        sensitivity: 0.5,
        timeline: [] as TimelineSegment[], 
        useTimeline: false 
    });

    useEffect(() => {
        paramsRef.current = { 
            filter: selectedFilter, 
            x: offsetX, 
            y: offsetY,
            sensitivity: sensitivity,
            timeline: timeline,
            useTimeline: useTimeline
        };
    }, [selectedFilter, offsetX, offsetY, sensitivity, timeline, useTimeline]);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io('http://127.0.0.1:8080');

        socketRef.current.on('connect', () => {
            console.log("Connected to WebSocket");
        });

        socketRef.current.on('response_frame', (data: { image: string }) => {
            if (processedImgRef.current) {
                processedImgRef.current.src = data.image;
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (processingIntervalRef.current) clearInterval(processingIntervalRef.current);
        };
    }, []);

    const startProcessing = async () => {
        if (!videoRef.current) return;

        videoRef.current.play();
        setIsProcessing(true);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        processingIntervalRef.current = setInterval(() => {
            if (!videoRef.current || !ctx || !socketRef.current) return;

            // Draw current video frame to canvas
            // OPTIMIZATION: Downscale to 480p width (maintain aspect ratio)
            const scale = 640 / videoRef.current.videoWidth;
            canvas.width = 640;
            canvas.height = videoRef.current.videoHeight * scale;

            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            // Compress to JPEG and send
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            
            // Determine active filter
            let activeFilter = paramsRef.current.filter;
            
            if (paramsRef.current.useTimeline && videoRef.current) {
                const currentTime = videoRef.current.currentTime;
                const segment = paramsRef.current.timeline.find(
                    seg => currentTime >= seg.start && currentTime < seg.end
                );
                if (segment) {
                    activeFilter = segment.filter;
                }
            }

            // Send both image and the current parameters
            socketRef.current.emit('process_frame', { 
                image: dataUrl,
                filter_type: activeFilter,
                offset_x: paramsRef.current.x,
                offset_y: paramsRef.current.y,
                sensitivity: paramsRef.current.sensitivity
            });

        }, 100); // ~30 FPS
    }

    const stopProcessing = () => {
        setIsProcessing(false);
        if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomVideoSrc(url);
            // Stop processing if running to avoid glitches
            stopProcessing();
        }
    };

    return (
        <div className="app-container">
            <h1>VIDEO AI STUDIO</h1>
            
            <div className="main-grid">
                
                {/* Source Column */}
                <div className="video-card">
                    <div className="controls-header">
                        <h3>Source Footage</h3>
                        <div>
                             <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handleFileUpload}
                                style={{ display: 'none' }} 
                                id="video-upload"
                            />
                            <label htmlFor="video-upload" className="upload-label">
                                📁 Upload File
                            </label>
                        </div>
                    </div>
                    <div className="video-wrapper">
                        <VideoPlayer
                            ref={videoRef}
                            src={customVideoSrc || videoUrl}
                            crossOrigin='anonymous'
                        />
                    </div>
                </div>

                {/* Processed Column */}
                <div className="video-card">
                    <div className="controls-header">
                        <h3>AI Output</h3>
                        {!isProcessing ? (
                            <button onClick={startProcessing} className="btn btn-primary">
                                ▶ Start Processing
                            </button>
                        ) : (
                            <button onClick={stopProcessing} className="btn btn-danger">
                                ■ Stop
                            </button>
                        )}
                    </div>
                    <div className="video-wrapper">
                        <img
                            ref={processedImgRef}
                            alt="Processed Stream"
                        />
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="controls-section">
                <h3>Effect Controls</h3>
                
                {/* Filters */}
                <div className="filter-grid" style={{ marginBottom: '30px' }}>
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`filter-chip ${selectedFilter === filter.id ? 'active' : ''}`}
                        >
                            {filter.name}
                        </button>
                    ))}
                </div>

                {/* Sliders */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '20px' }}>
                    <div className="slider-group">
                        <label>Horizontal Offset</label>
                        <input 
                            type="range" 
                            min="-200" 
                            max="200" 
                            value={offsetX} 
                            onChange={(e) => setOffsetX(parseInt(e.target.value))}
                        />
                        <span style={{ width: '40px', textAlign: 'right', color: '#666' }}>{offsetX}</span>
                    </div>
                    <div className="slider-group">
                        <label>Vertical Offset</label>
                        <input 
                            type="range" 
                            min="-200" 
                            max="200" 
                            value={offsetY} 
                            onChange={(e) => setOffsetY(parseInt(e.target.value))}
                        />
                        <span style={{ width: '40px', textAlign: 'right', color: '#666' }}>{offsetY}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <div className="slider-group" style={{ flexGrow: 1 }}>
                        <label>Mask Sensitivity</label>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="0.9" 
                            step="0.05"
                            value={sensitivity} 
                            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                        />
                        <span style={{ width: '40px', textAlign: 'right', color: '#666' }}>{sensitivity}</span>
                    </div>
                    
                    <button 
                        onClick={() => { setOffsetX(0); setOffsetY(0); setSensitivity(0.5); }}
                        className="btn btn-ghost"
                        style={{ border: '1px solid var(--border)' }}
                    >
                        ⟲ Reset All
                    </button>
                </div>
            </div>

            {/* Timeline Editor */}
            <div className="controls-section">
                <div className="controls-header">
                    <h3>Sequencer</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={useTimeline} 
                            onChange={(e) => setUseTimeline(e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ color: useTimeline ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>
                            Enable Timeline
                        </span>
                    </label>
                </div>

                {useTimeline && (
                    <div className="timeline-editor">
                        <div className="timeline-input-group">
                            <input 
                                className="input-dark"
                                type="number" 
                                placeholder="Start" 
                                value={newSegment.start} 
                                onChange={(e) => setNewSegment({...newSegment, start: Number(e.target.value)})}
                                style={{ width: '80px' }}
                            />
                            <span style={{ color: '#666' }}>➜</span>
                            <input 
                                className="input-dark"
                                type="number" 
                                placeholder="End" 
                                value={newSegment.end} 
                                onChange={(e) => setNewSegment({...newSegment, end: Number(e.target.value)})}
                                style={{ width: '80px' }}
                            />
                            <select 
                                className="input-dark"
                                value={newSegment.filter} 
                                onChange={(e) => setNewSegment({...newSegment, filter: e.target.value})}
                                style={{ flexGrow: 1 }}
                            >
                                {FILTERS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <button 
                                onClick={() => {
                                    setTimeline([...timeline, { ...newSegment, id: Date.now().toString() }]);
                                    setNewSegment({ ...newSegment, start: newSegment.end, end: newSegment.end + 5 }); 
                                }}
                                className="btn btn-primary"
                            >
                                + Add Keyframe
                            </button>
                        </div>

                        <div className="timeline-list">
                            {timeline.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#666', border: '1px dashed #333', borderRadius: '8px' }}>
                                    No active keyframes. Add one above to sequence effects.
                                </div>
                            )}
                            {timeline.sort((a,b) => a.start - b.start).map((seg) => (
                                <div key={seg.id} className="timeline-item">
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {seg.start.toFixed(1)}s — {seg.end.toFixed(1)}s
                                        </span>
                                        <span className="filter-chip" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                            {FILTERS.find(f => f.id === seg.filter)?.name}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setTimeline(timeline.filter(t => t.id !== seg.id))}
                                        className="btn btn-ghost"
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
