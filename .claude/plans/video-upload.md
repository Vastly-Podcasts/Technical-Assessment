# Plan: Video Upload Feature

## Goal
Allow users to upload any video file to replace the hardcoded video URL.

## Done-When
- [ ] User can select video file via file input
- [ ] Selected video plays in ProcessedVideo component
- [ ] Object URLs properly cleaned up (no memory leaks)
- [ ] Works with common video formats (mp4, webm, mov)
- [ ] Default video still works when no upload selected
- [ ] Clear error messages for invalid files

## Solution Exploration

### Solution 1: Native File API + Object URLs (Client-Side Only)
**How:** Use native `URL.createObjectURL()` with file input. No backend needed for preview.
**Code required:** ~30 lines
**Dependencies:** None (native browser APIs)
**Pros:** 
- Zero dependencies
- Instant preview (no upload wait)
- Works offline
- Minimal code
- Already documented in App.tsx comments
**Cons:** 
- Limited to browser memory for file size
- No persistence (file lost on refresh)
**Complexity:** Simple

### Solution 2: Backend Upload + URL Return
**How:** Upload to Flask endpoint, save to temp directory, return URL for frontend.
**Code required:** ~80 lines (frontend + backend)
**Dependencies:** None (Flask werkzeug handles multipart)
**Pros:**
- Files persist across page refreshes
- Can handle larger files
- Server-side validation
**Cons:**
- More code (frontend + backend)
- Requires upload wait time
- Need cleanup mechanism for temp files
- More complex error handling
**Complexity:** Medium

### Solution 3: Third-Party Upload Library (react-dropzone, etc.)
**How:** Use library like react-dropzone for drag-and-drop + upload.
**Code required:** ~50 lines + dependency
**Dependencies:** react-dropzone (~500KB bundle)
**Pros:**
- Drag-and-drop support
- Built-in progress indicators
- Handles edge cases
**Cons:**
- Adds dependency (maintenance burden)
- Larger bundle size
- Overkill for simple file input
**Complexity:** Medium

## Decision

**Chosen:** Solution 1 (Native File API + Object URLs)
**Why:** 
- Simplest: ~30 lines vs 80+ lines
- Zero dependencies (native browser API)
- Matches existing codebase pattern (no external libs for simple features)
- Already documented in App.tsx comments (lines 35-39)
- Instant user feedback (no upload wait)
- ProcessedVideo already accepts URL strings - no changes needed there

**Rejected:**
- Solution 2: Overkill for preview-only use case. Can add later if persistence needed.
- Solution 3: Unnecessary dependency for simple file input. Native HTML5 is sufficient.

## Implementation Steps

### Step 1: Add State and Error Handling in App.tsx
- [ ] Add state: `const [videoFile, setVideoFile] = useState<File | null>(null)`
- [ ] Add error state: `const [uploadError, setUploadError] = useState<string | null>(null)`
- [ ] Store only `videoFile` in state (derive `objectUrl` in useEffect to avoid redundancy)

### Step 2: Create File Validation Utility
- [ ] Create `isValidVideoFile(file: File): boolean` function
  - Check MIME type: `file.type.startsWith('video/')`
  - Fallback: Check extension against `['.mp4', '.webm', '.mov', '.avi', '.mkv']`
  - Return true if either check passes
- [ ] Add file size validation: `MAX_FILE_SIZE = 500 * 1024 * 1024` (500MB)
  - Show error if file exceeds limit

### Step 3: Add File Input Handler
- [ ] Handle file selection:
  ```typescript
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadError(null); // User cancelled
      return;
    }
    
    // Validate file
    if (!isValidVideoFile(file)) {
      setUploadError("Please select a valid video file (mp4, webm, mov, avi, mkv)");
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }
    
    // Clear previous error, set new file
    setUploadError(null);
    setVideoFile(file);
  };
  ```

### Step 4: Object URL Management with Proper Cleanup
- [ ] Create useEffect to manage object URLs:
  ```typescript
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!videoFile) {
      // Clear object URL when no file selected
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      return;
    }
    
    // Store previous URL before creating new one
    const previousUrl = objectUrl;
    
    // Create new object URL
    const newUrl = URL.createObjectURL(videoFile);
    setObjectUrl(newUrl);
    
    // Revoke previous URL AFTER new one is set (prevents race condition)
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }
    
    // Cleanup on unmount or when videoFile becomes null
    return () => {
      if (newUrl) {
        URL.revokeObjectURL(newUrl);
      }
    };
  }, [videoFile]); // Only depend on videoFile, not objectUrl
  ```

### Step 5: Update ProcessedVideo Component
- [ ] Modify ProcessedVideo to conditionally set crossOrigin:
  ```typescript
  // Detect if URL is object URL (starts with blob:) vs external URL
  const isObjectUrl = src.startsWith('blob:');
  
  <video
    src={src}
    crossOrigin={isObjectUrl ? undefined : "anonymous"}
    // ... other props
  />
  ```
- [ ] **Note:** When `src` changes, ProcessedVideo will restart segmentation (expected behavior)
  - Video element reloads → triggers `handleLoadedMetadata` → restarts MediaPipe pipeline
  - This causes ~100-300ms delay and video state reset (play/pause/position)
  - Document this as expected behavior (no fix needed)

### Step 6: Add onDurationChange Callback (Coordination with timeframe-filters)
- [ ] Add prop to ProcessedVideo: `onDurationChange?: (duration: number) => void`
- [ ] Call it in `handleLoadedMetadata`: `onDurationChange?.(video.duration)`
- [ ] In App.tsx, store duration: `const [videoDuration, setVideoDuration] = useState<number | null>(null)`
- [ ] Use for file validation (optional, but useful for future features)

### Step 7: Update App.tsx to Use Object URL
- [ ] Pass `objectUrl || videoUrl` to ProcessedVideo `src` prop
- [ ] Pass `onDurationChange={setVideoDuration}` to ProcessedVideo

### Step 8: Add File Input UI
- [ ] Add file input in controls section:
  ```typescript
  <div className="upload-control">
    <label htmlFor="video-upload" className="upload-button">
      {videoFile ? videoFile.name : 'Upload Video'}
    </label>
    <input
      id="video-upload"
      type="file"
      accept="video/*"
      onChange={handleFileSelect}
      style={{ display: 'none' }}
    />
    {videoFile && (
      <button onClick={() => { setVideoFile(null); setUploadError(null); }}>
        Reset
      </button>
    )}
    {uploadError && (
      <div className="error-message" style={{ color: 'red', fontSize: '0.875rem' }}>
        {uploadError}
      </div>
    )}
  </div>
  ```

### Step 9: Handle Edge Cases
- [ ] Handle file input cancel (check `files.length === 0`)
- [ ] Handle video load errors (listen to `video.onerror` in ProcessedVideo, fallback to default)
- [ ] Document codec compatibility limitation (some codecs may not play in all browsers)

## Code Estimate

**Files to modify:**
- `frontend/src/App.tsx`: +60 lines (state, validation, handler, cleanup, UI, error handling)
- `frontend/src/components/ProcessedVideo.tsx`: +5 lines (conditional crossOrigin, onDurationChange callback)

**Total:** ~65 lines of code (increased due to proper error handling and cleanup)

## Validation

- [ ] Select video file, verify it plays
- [ ] Test mp4, webm, mov, avi, mkv formats
- [ ] Test file with correct extension but missing MIME type (extension fallback)
- [ ] Test file with correct MIME type but wrong extension (MIME type check)
- [ ] Test file size limit (500MB) - verify error shown
- [ ] Test invalid file type (e.g., .pdf) - verify error shown
- [ ] Test file input cancel - verify no error shown
- [ ] Verify object URL cleanup (check memory in devtools, select multiple files)
- [ ] Test rapid file selection (race condition prevention)
- [ ] Test reset to default video
- [ ] Verify crossOrigin is undefined for object URLs, "anonymous" for external URLs
- [ ] Verify ProcessedVideo restarts segmentation on src change (expected behavior)
- [ ] Test video load error - verify fallback to default
- [ ] Verify no console errors
- [ ] Type check passes (`npx tsc --noEmit`)

## Common Pitfalls (from research)

1. **Memory leak from unreleased object URLs**
   - Fix: Always revoke in useEffect cleanup, revoke previous URL AFTER creating new one
   - Prevention: Store only videoFile in state, derive objectUrl in useEffect

2. **crossOrigin attribute on object URLs**
   - Fix: Conditionally set: `crossOrigin={src.startsWith('blob:') ? undefined : "anonymous"}`
   - Prevention: Detect object URLs by checking if URL starts with 'blob:'

3. **File validation too strict**
   - Fix: Check both MIME type (`file.type.startsWith('video/')`) AND extension fallback
   - Prevention: Support common extensions: `.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`

4. **Race conditions in cleanup**
   - Fix: Store previous URL before creating new one, revoke after new URL is set
   - Prevention: Only depend on `videoFile` in useEffect, not `objectUrl`

5. **ProcessedVideo segmentation restart on src change**
   - Expected behavior: Video reloads → segmentation restarts (~100-300ms delay)
   - No fix needed: This is how video elements work, document as expected

6. **Missing error handling**
   - Fix: Store errors in state, display inline, clear on success or new selection
   - Prevention: Validate before creating object URL, show clear error messages

## Coordination with Other Features

### ProcessedVideo Component Modifications
- **crossOrigin conditional logic**: Both video-upload and timeframe-filters may need this
- **onDurationChange callback**: Added for video-upload, also needed by timeframe-filters
- **No conflicts**: timeframe-filters adds `activeTimeframes` prop, video-upload modifies `crossOrigin` - both safe

### Implementation Order
- **Video Upload should be implemented first** (simpler, foundation)
- Establishes `onDurationChange` callback that timeframe-filters needs
- Establishes video source change handling pattern

---
Created: 2026-01-12
Updated: 2026-01-12 (addressed teardown review issues)
Status: READY FOR EXECUTION (after addressing teardown issues)
