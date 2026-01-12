# Project State — Video Background Filter

**Last Updated:** 2026-01-12
**Status:** Initialized

---

## Current Reality

### Codebase Structure
```
Technical-Assessment/
├── backend/           # Flask backend (to implement)
├── frontend/          # React frontend (partially scaffolded)
├── .claude/           # Claude Code configuration
│   ├── commands/      # Workflow commands
│   └── CLAUDE.md      # Project-specific rules
└── kernel/            # KERNEL methodology
    ├── banks/         # Reference banks
    ├── commands/      # KERNEL commands
    └── state.md       # This file
```

### Stack Detected
- **Backend**: Python 3.x, Flask, OpenCV, MediaPipe
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build**: npm/react-scripts, pip

### Dependencies
**Backend** (requirements.txt):
- ffmpeg-python
- requests
- python-dotenv
- flask
- flask_cors
- opencv-python

**Frontend** (package.json):
- @mediapipe/selfie_segmentation
- @mediapipe/camera_utils
- React 18 + TypeScript
- Tailwind CSS + tailwind-merge
- lucide-react (icons)

---

## Implementation Status

### Core Features
- [ ] Person segmentation (MediaPipe selfie segmentation)
- [ ] Background filter (grayscale/sepia)
- [ ] Real-time video streaming
- [ ] Frontend video display
- [ ] Filter selection UI

### Integration Points
- [ ] Flask → React (CORS configured)
- [ ] Video stream endpoint
- [ ] WebSocket or MJPEG streaming

---

## Known Issues

*Populate as discovered*

---

## Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| TIER: 2 | Production-grade but time-bounded | 2026-01-12 |

---

## Research Substrate

Debugging references available at:
```
../mediapipe/       # Segmentation issues
../opencv/          # Video processing gotchas
../flask-streaming/ # Streaming architecture
../cors/            # CORS configuration
../implementation/  # Filter implementation notes
```

---

## Next Actions

1. Run `/discover` to map existing code
2. Implement person segmentation
3. Apply selective background filter
4. Stream processed video to frontend
5. Polish UI/UX

---

*Updated by KERNEL /kernel:init*
