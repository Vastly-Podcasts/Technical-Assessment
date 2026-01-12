# Video Background Filter

A real-time video processing application that applies visual filters to video backgrounds while preserving the person/speaker in full color. Uses MediaPipe for GPU-accelerated person segmentation.

## Features

- **Real-time person segmentation** via MediaPipe SelfieSegmentation
- **Background filters**: Grayscale, Sepia, Blur (GPU-accelerated), None
- **Adjustable sensitivity** for person/background boundary detection
- **Video upload** with type/size validation (mp4, webm, mov, avi, mkv)
- **Timeframe-based filter control** - apply filters to specific time ranges
- **Three viewing modes**: Minimal, Theater, Editor

## Project Structure

```
├── frontend/               # React + TypeScript application
│   ├── src/
│   │   ├── App.tsx         # Main application component
│   │   ├── components/
│   │   │   ├── ProcessedVideo.tsx    # Video + segmentation + compositing
│   │   │   ├── TimeframeEditor.tsx   # Timeframe management UI
│   │   │   └── ErrorBoundary.tsx     # Error handling
│   │   ├── utils/
│   │   │   ├── filters.ts        # Filter implementations (grayscale, sepia, blur)
│   │   │   ├── timeframes.ts     # Timeframe validation and lookup
│   │   │   └── videoValidation.ts # File type/size validation
│   │   └── consts.ts       # Default video URL configuration
│   └── package.json
└── requirements.txt        # Python dependencies (backend placeholder)
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Running the Application

```bash
npm start
```

The application runs at `http://localhost:3000`

## Usage

1. **View video** - Default sample video loads automatically
2. **Upload custom video** - Click "Upload Video" to use your own video
3. **Select filter** - Choose Grayscale, Sepia, Blur, or None
4. **Adjust sensitivity** - Slider controls person/background boundary detection
5. **Add timeframes** - Define specific time ranges where filters should apply
6. **Switch view modes** - Minimal (clean), Theater (focused), Editor (timeline)

## Technical Implementation

### Segmentation Pipeline

1. MediaPipe SelfieSegmentation generates per-pixel mask
2. Mask threshold determines person vs. background classification
3. Background pixels receive filter transformation
4. Person pixels remain in original color
5. Composited frame renders to canvas at video framerate

### Filter Performance

- **Grayscale/Sepia**: CPU pixel manipulation (luminosity formula)
- **Blur**: GPU-accelerated via canvas `filter` API (20-40x faster than CPU)
- Targets 30fps+ on modern hardware at 1080p

### Timeframe System

- Sorted array for O(log n) lookup during playback
- Binary search finds active timeframe at current timestamp
- Filters dynamically enable/disable based on video position

## Technologies

- **React 18** + TypeScript
- **MediaPipe SelfieSegmentation** - real-time person segmentation
- **Canvas API** - video compositing and GPU-accelerated filters
- **Tailwind CSS** - styling

## Extending

### Adding New Filters

1. Create filter function in `frontend/src/utils/filters.ts`:
   ```ts
   export function applyMyFilter(imageData: ImageData): void {
     // Modify imageData.data in-place (RGBA format)
   }
   ```
2. Add to `FILTERS` object and `FilterType` union
3. Add metadata to `FILTER_INFO` array - UI auto-updates

### Video Export (Future)

```ts
// MediaRecorder API with canvas stream
const stream = canvas.captureStream(30);
const recorder = new MediaRecorder(stream);
```

## License

Technical assessment project.
