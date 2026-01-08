from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import logging
from helpers import *
import cv2
import base64
import numpy as np
from video_processing.video_processor import VideoProcessor

app = Flask(__name__)
cors = CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

processor = VideoProcessor()


@socketio.on("process_frame")
def handle_frame(data):
    try:
        # 1. Decode base64 image
        image_data = data["image"].split(",")[1]
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return

        # 2. Process frame
        # Get filter_type from request, default to 'black_background' if missing
        filter_type = data.get("filter_type", "black_background")
        offset_x = int(data.get("offset_x", 0))
        offset_y = int(data.get("offset_y", 0))
        sensitivity = float(data.get("sensitivity", 0.5))

        processed_frame = processor.process_frame(
            frame,
            filter_type=filter_type,
            offset_x=offset_x,
            offset_y=offset_y,
            sensitivity=sensitivity,
        )

        # 3. Encode back to base64
        _, buffer = cv2.imencode(".jpg", processed_frame)
        processed_base64 = base64.b64encode(buffer).decode("utf-8")

        # 4. Send back
        emit("response_frame", {"image": f"data:image/jpeg;base64,{processed_base64}"})

    except Exception as e:
        logger.error(f"Error processing frame: {e}")


@app.route("/hello-world", methods=["GET"])
def hello_world():
    try:
        return jsonify({"Hello": "World"}), 200
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8080, debug=True, allow_unsafe_werkzeug=True)
