from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from helpers import *
import cv2
import mediapipe as mp
import numpy as np
import base64

app = Flask(__name__)
cors = CORS(app)

load_dotenv()

# Mediapipe selfie segmentation 
mp_selfie = mp.solutions.selfie_segmentation 
selfie_model = mp_selfie.SelfieSegmentation(model_selection=1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/process-frame', methods=['POST'])
def process_frame():
    # Obtain image data from request
    data = request.json.get('image')
    if not data:
        return jsonify({"error": "No Image provided"}), 400
    
    # Remove metadata header
    header,encoded = data.split(",", 1)
    nparr = np.frombuffer(base64.b64decode(encoded), np.uint8) 
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 3. Process the frame with MediaPipe
    # Convert BGR (OpenCV) to RGB (MediaPipe)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = selfie_model.process(rgb_frame)

    # Get the segmentation mask (1.0 = person, 0.0 = background)
    mask = results.segmentation_mask

    # Enhancement to prevent orange halo and jagged edges
    mask_binary = (mask > 0.45).astype(np.float32)
    mask_refined = cv2.GaussianBlur(mask_binary, (7, 7), 0)
    condition = np.stack((mask_refined,) * 3, axis=-1)
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray_bg = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2BGR)
    output_frame = (frame * condition + gray_bg * (1 - condition)).astype(np.uint8)

    # 5. Encode the result back to base64
    _, buffer = cv2.imencode('.jpg', output_frame)
    encoded_image = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
            "image": f"data:image/jpeg;base64,{encoded_image}"
        }), 200
    

@app.route("/hello-world", methods=["GET"])
def hello_world():
    try:
        return jsonify({"Hello": "World"}), 200
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=True)
