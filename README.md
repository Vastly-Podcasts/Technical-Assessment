# Realtime Person Segmentation using MediaPipe and Flask 

A full-stack implementation for real-time video processing pipeline utilizing MediaPipe Selfie Segmentation and OpenCV to isolate a person in a video stream and apply selective grayscale background filter.

# Key Features

- Selective Background Filtering: Dynamically converts background pixels to grayscale while preserving the subject's full color. 
- Refined Mask Blending: Implemented Gaussian-blurred binary masks to eliminate the "orange halo" effect and ensure smooth transitions around extremities. 
- Seamless UI Expansion: Replaced the dual-video layout with an "In-Place Overlay" system. When filtering is active, the AI output perfectly masks the source video for a cleaner UX. 
- Real-Time Synchronization: Uses requestAnimationFrame on the frontend and optimized JPEG compression to maintain high-performance processing loops.


# Technical Refinements
During the assessment, I prioritized Product Engineering by addressing visual edge cases:

1. Anti-Auraing: Thresholding logic (mask > 0.45) with Gaussian blur to feather edges of segmentation 
2. Linear Blending: Used formula Output = (Frame * Mask) + (GrayFrame * (1-Mask)) for enhanced alpha matting
3. Layout Stability: Utilized CSS absolute positioning and aspect-ratio locking to prevent layout shifts during 
                     raw video to AI output transition.


# Getting Started

# Backend Setup(/app)
1. Navigate to /app directory
2. Create virtual environment and install dependencies
   ```bash
   pip install -r requirements.txt
   ```      
3. Start the server
   ```bash
   python3 main.py
   ```
   Runs on http://127.0.0.1:8080


# Frontend Setup (/frontend)
1. Navigate to the /frontend directory.
2. Install dependencies and start
   ```bash
   npm install
   npm start
   ```
Runs on http://localhost:3000

# Troubleshooting 
Issue: AttributeError: module 'mediapipe' has no attribute 'solutions'

Root Cause: Modern versions of MediaPipe (v0.10.10+) have moved toward the Tasks API, deprecating the legacy solutions namespace used in this implementation.

Resolution: Performed a version rollback to ensure compatibility with the legacy
  ```bash
   pip uninstall mediapipe
   pip install mediapipe==0.10.9
  ```

# Installation
Backend: cd app && pip install -r requirements.txt && python main.py 
Frontend: cd frontend && npm install && npm start