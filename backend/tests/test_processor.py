import cv2
import numpy as np
import urllib.request
import os
import sys
import av

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from video_processing.video_processor import VideoProcessor

def run_test():
    
    
    test_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Update this to match your filename (e.g., test_photo.avif)
    image_path = os.path.join(test_dir, "test_photo.avif")
    output_path = os.path.join(test_dir, "test_output.jpg")
    
    processor = VideoProcessor()


    if not os.path.exists(image_path):
        print(f"Error: Could not find image at {image_path}")
        return
    
    # Try loading with PyAV first (better codec support for AVIF), fall back to OpenCV
    try:
        with av.open(image_path) as container:
            # Get the first frame and convert to BGR numpy array (what OpenCV expects)
            frame = next(container.decode(video=0)).to_ndarray(format='bgr24')
    except Exception as e:
        print(f"PyAV load failed ({e}), trying OpenCV...")
        frame = cv2.imread(image_path)
    
    if frame is None:
        print("Error: did not load image")
        return

    processed_frame = processor.process_frame(frame, filter_type="black_background")
    cv2.imwrite(output_path, processed_frame)
    print(f"Successfully processed image to {output_path}")
    
if __name__ == "__main__":
    run_test()