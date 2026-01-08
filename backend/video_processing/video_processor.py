import cv2
import numpy as np
import mediapipe as mp
import os
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class VideoProcessor:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, '..', 'models','selfie_segmenter.tflite')
        
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.ImageSegmenterOptions(
            base_options=base_options,
            output_category_mask=False,
            output_confidence_masks=True 
        )
        self.segmenter = vision.ImageSegmenter.create_from_options(options)
    
    
    def process_frame(self, frame, filter_type="black_background", offset_x=0, offset_y=0, sensitivity=0.5):
        
        # Optimization: If no filter and no offset, return the original frame early
        if filter_type == "none" and offset_x == 0 and offset_y == 0:
            return frame

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        segmentation_result = self.segmenter.segment(mp_image)
        
        if segmentation_result.confidence_masks:
            # Fallback to confidence if available
            mask = segmentation_result.confidence_masks[0].numpy_view()
            condition = mask > sensitivity # Threshold for "person"
        else:
            print("Error: No mask returned by model")
            return frame

        # Ensure 3D shape for broadcasting: If mask is (H, W), make it (H, W, 1)
        if len(condition.shape) == 2:
            condition = condition[:, :, np.newaxis]

        # --- Handle Mask/Person Movement ---
        # If offsets are provided, shift the condition (mask) AND the source frame 'frame' (the person pixels)
        # We need to shift 'frame' so the person moves, not just the mask hole.
        
        person_frame = frame
        
        if offset_x != 0 or offset_y != 0:
            M = np.float32([[1, 0, offset_x], [0, 1, offset_y]])
            h, w = frame.shape[:2]
            
            # Shift the mask
            # Using warpAffine on the boolean/float mask. 
            # Need to convert condition to float/int for warping, then back
            condition_float = condition.astype(np.float32)
            condition_shifted = cv2.warpAffine(condition_float, M, (w, h))
            # Restore extra dim
            if len(condition_shifted.shape) == 2:
                condition_shifted = condition_shifted[:, :, np.newaxis]
            condition = condition_shifted > 0.5 # Re-binarize
            
            # Shift the person image as well (so the pixels move with the mask)
            person_frame = cv2.warpAffine(frame, M, (w, h))


        # --- Generate Background based on filter_type ---
        if filter_type == "black_background":
            background = np.zeros_like(frame) 
            
        elif filter_type == "blur":
            # Apply heavy blur to the original frame
            background = cv2.GaussianBlur(frame, (55, 55), 0)
            
        elif filter_type == "grayscale":
            # Convert to gray then back to BGR so it has 3 channels
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            background = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            
        elif filter_type == "sepia":
            # Standard Sepia Filter Matrix
            kernel = np.array([[0.272, 0.534, 0.131],
                               [0.349, 0.686, 0.168],
                               [0.393, 0.769, 0.189]])
            background = cv2.transform(frame, kernel)
            background = np.clip(background, 0, 255) # Ensure valid pixel range
            
        elif filter_type == "heatmap":
             # Apply COLORMAP_JET to the grayscale version
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            background = cv2.applyColorMap(gray, cv2.COLORMAP_JET)

        elif filter_type == "canny":
            # Edge detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            # Convert edges to 3 channels (white edges on black background)
            background = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        elif filter_type == "universe":
            # Procedural Space + Stick Figures
            background = np.zeros_like(frame)
            h, w, _ = frame.shape
            
            # 1. Draw random stars
            num_stars = 80
            for _ in range(num_stars):
                x = np.random.randint(0, w)
                y = np.random.randint(0, h)
                cv2.circle(background, (x, y), np.random.randint(1, 3), (255, 255, 255), -1)
            
            # 2. Draw Stick Figures 
            num_stickmen = 5
            for _ in range(num_stickmen):
                # Random position
                sx = np.random.randint(50, w-50)
                sy = np.random.randint(50, h-100)
                
                # Head
                cv2.circle(background, (sx, sy), 10, (0, 255, 0), 2)
                # Body
                cv2.line(background, (sx, sy+10), (sx, sy+60), (0, 255, 0), 2)
                # Arms
                cv2.line(background, (sx-20, sy+30), (sx+20, sy+30), (0, 255, 0), 2)
                # Legs
                cv2.line(background, (sx, sy+60), (sx-15, sy+90), (0, 255, 0), 2)
                cv2.line(background, (sx, sy+60), (sx+15, sy+90), (0, 255, 0), 2)

        else:
            # Default to original frame (no effect)
            background = frame
            
        # Combine: Where condition is True (person), use person_frame (shifted). Else use background.
        output_frame = np.where(condition, person_frame, background)
        
        return output_frame.astype(np.uint8)
