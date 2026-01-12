"""
main.py

Flask backend for the Video Background Filter application.

============================================================================
ARCHITECTURE DECISION
============================================================================

The frontend handles real-time processing using MediaPipe.js in the browser.
This keeps latency low and scales naturally (user's device does the work).

The backend provides:
1. Filter configuration API - list available filters, validate settings
2. Future: Video upload handling
3. Future: Server-side processing for export/download
4. Future: User preferences persistence

This separation gives us:
- Real-time preview (frontend) with zero network latency
- Heavy processing capability (backend) when needed
- Clean API contract between frontend and backend

============================================================================
FOR FUTURE AI AGENTS / DEVELOPERS
============================================================================

When extending this backend:

1. VIDEO UPLOAD:
   - Add POST /api/upload endpoint
   - Accept multipart/form-data with video file
   - Save to temp directory (use get_temp_path from helpers)
   - Return URL/ID for frontend to use
   - Clean up old files periodically

2. SERVER-SIDE PROCESSING:
   - Add POST /api/process endpoint
   - Accept video ID and filter settings
   - Use MediaPipe Python (mediapipe.solutions.selfie_segmentation)
   - Process frame-by-frame, apply filter, write output
   - Return download URL when complete

   Example processing flow:
   ```python
   import mediapipe as mp
   mp_selfie = mp.solutions.selfie_segmentation

   with mp_selfie.SelfieSegmentation(model_selection=0) as segmentation:
       results = segmentation.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
       mask = results.segmentation_mask
       # Apply filter using mask (same logic as frontend)
   ```

3. WEBSOCKET STREAMING:
   - For real-time server-side processing (if needed)
   - Use flask-socketio
   - Stream processed frames as base64 or binary

============================================================================
KNOWN GOTCHAS
============================================================================

- CORS is enabled globally. For production, restrict to specific origins.
- Debug mode is on. Disable for production.
- No authentication. Add if needed for user-specific features.

"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from helpers import *

app = Flask(__name__)
cors = CORS(app)

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# FILTER CONFIGURATION
# =============================================================================

# Available filters - matches frontend utils/filters.ts
# Single source of truth for filter metadata
AVAILABLE_FILTERS = [
    {
        "id": "none",
        "name": "None",
        "description": "No filter applied",
    },
    {
        "id": "grayscale",
        "name": "Grayscale",
        "description": "Classic black & white",
    },
    {
        "id": "sepia",
        "name": "Sepia",
        "description": "Warm vintage tone",
    },
    {
        "id": "blur",
        "name": "Blur",
        "description": "Gaussian blur effect",
    },
]


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route("/hello-world", methods=["GET"])
def hello_world():
    """
    Health check endpoint.

    Used by frontend to verify backend connectivity.
    Returns simple JSON response if server is running.
    """
    try:
        return jsonify({"Hello": "World"}), 200
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/filters", methods=["GET"])
def get_filters():
    """
    Get available filter configurations.

    Returns list of filters that can be applied to video background.
    Frontend can use this to populate filter selector dynamically.

    Response:
    {
        "filters": [
            {"id": "grayscale", "name": "Grayscale", "description": "..."},
            ...
        ]
    }
    """
    try:
        return jsonify({"filters": AVAILABLE_FILTERS}), 200
    except Exception as e:
        logger.error(f"Error fetching filters: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/filters/<filter_id>", methods=["GET"])
def get_filter(filter_id):
    """
    Get specific filter configuration by ID.

    Useful for validating filter ID or getting details for a single filter.

    Response:
    {"id": "grayscale", "name": "Grayscale", "description": "..."}

    Error (404):
    {"error": "Filter not found"}
    """
    try:
        filter_config = next(
            (f for f in AVAILABLE_FILTERS if f["id"] == filter_id),
            None
        )

        if filter_config is None:
            return jsonify({"error": "Filter not found"}), 404

        return jsonify(filter_config), 200
    except Exception as e:
        logger.error(f"Error fetching filter {filter_id}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Detailed health check endpoint.

    Returns server status and capabilities.
    Useful for monitoring and debugging.
    """
    try:
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "capabilities": {
                "filters": len(AVAILABLE_FILTERS),
                "upload": False,  # TODO: Enable when upload is implemented
                "export": False,  # TODO: Enable when export is implemented
            }
        }), 200
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


# =============================================================================
# PLACEHOLDER ENDPOINTS (for future implementation)
# =============================================================================

@app.route("/api/upload", methods=["POST"])
def upload_video():
    """
    Upload a video for processing.

    TODO: Implement video upload handling
    - Accept multipart/form-data
    - Validate file type and size
    - Save to temp directory
    - Return video ID for processing
    """
    return jsonify({
        "error": "Not implemented",
        "message": "Video upload is planned for future implementation"
    }), 501


@app.route("/api/process", methods=["POST"])
def process_video():
    """
    Process uploaded video with filter.

    TODO: Implement server-side processing
    - Accept video ID and filter settings
    - Process using MediaPipe Python
    - Return processed video URL
    """
    return jsonify({
        "error": "Not implemented",
        "message": "Server-side processing is planned for future implementation"
    }), 501


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)
