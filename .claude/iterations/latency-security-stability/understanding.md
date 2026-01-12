# Understanding: Latency, Security, Stability & Network Issues

**Analyzed:** 2025-01-12
**Target:** Full project (frontend + backend)

---

## Purpose

This is a React + Flask video processing application that applies filters to video backgrounds using MediaPipe segmentation. The frontend handles real-time processing in the browser, while the backend provides API endpoints for configuration and future server-side processing.

## Architecture

**Frontend (React + TypeScript):**
- Real-time video processing using MediaPipe.js
- Canvas-based compositing for filter effects
- Video upload and timeframe editing
- Direct API calls to Flask backend

**Backend (Flask + Python):**
- REST API for filter configuration
- Video upload handling
- File management and validation
- Background job processing

## Data Flow

1. **Video Processing:**
   - Video element → MediaPipe segmentation → Mask generation → Canvas compositing → Display

2. **API Communication:**
   - Frontend → `fetch('http://localhost:8080/api/health')` → Backend health check
   - Frontend → Backend for filter metadata (not currently used)
   - Frontend → Backend for video upload (when implemented)

3. **File Management:**
   - Uploaded videos stored in `backend/temp/`
   - Object URLs created for uploaded files
   - Cleanup handled manually

## Dependencies

**Frontend:**
- React 18, TypeScript
- MediaPipe selfie segmentation
- No HTTP client library (uses native fetch)

**Backend:**
- Flask with CORS enabled globally
- OpenCV, ffmpeg-python
- File validation helpers

## Key Issues Identified

### Latency Issues
1. **Hardcoded localhost URL** - Won't work over network
2. **No request timeout** - Requests can hang indefinitely
3. **No retry logic** - Failed requests fail silently
4. **Frequent health checks** - Every 10 seconds, no exponential backoff
5. **No request cancellation** - Can't cancel in-flight requests
6. **Large file uploads** - No chunking or progress tracking

### Security Issues
1. **CORS enabled globally** - Should be restricted to specific origins
2. **Debug mode enabled** - Exposes stack traces in production
3. **Console.log in production** - Information leakage
4. **No input sanitization** - XSS risk in user inputs
5. **No rate limiting** - Vulnerable to DoS
6. **No authentication** - All endpoints public
7. **Hardcoded URLs** - SSRF risk if used server-side
8. **No HTTPS enforcement** - Man-in-the-middle risk

### Stability Issues
1. **No error boundaries** - React errors crash entire app
2. **Unhandled promise rejections** - Silent failures
3. **Memory leaks** - Object URLs not always cleaned up
4. **Race conditions** - Async operations can conflict
5. **No timeout handling** - Operations can hang
6. **Missing cleanup** - Some event listeners not removed

### Network Issues
1. **Hardcoded localhost:8080** - Breaks in production
2. **No environment configuration** - Can't adapt to different environments
3. **No request timeout** - Network issues cause hangs
4. **No retry logic** - Transient failures cause permanent failures
5. **CORS misconfiguration** - Potential cross-origin issues

## Performance Characteristics

- **Video Processing:** Real-time at 30fps target
- **API Calls:** Synchronous, blocking
- **Health Checks:** Every 10 seconds
- **File Uploads:** Synchronous, no progress

## Security Considerations

- **CORS:** Enabled globally (security risk)
- **Debug Mode:** Enabled (information disclosure)
- **Input Validation:** Partial (file types, sizes)
- **Authentication:** None
- **Rate Limiting:** None
- **HTTPS:** Not enforced
