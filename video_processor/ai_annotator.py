import cv2
import numpy as np
from django.conf import settings

from google import genai
from google.genai import types


class AIAnnotator:
    """
    Uses OpenCV for scene detection and Gemini's vision model
    to describe what's happening in each scene.

    Uses the new `google-genai` SDK (google-generativeai is deprecated).
    Free tier: ~250 requests/day for gemini-3.6-flash.
    Get your key at https://aistudio.google.com/apikey
    """

    # Scene change threshold (higher = fewer, bigger scenes)
    SCENE_THRESHOLD = 40.0
    # Minimum clip length in seconds
    MIN_CLIP_LENGTH = 3.0
    # Maximum clip length in seconds
    MAX_CLIP_LENGTH = 30.0

    MODEL_NAME = 'gemini-3.6-flash'

    def __init__(self):
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not set. Add it to your .env file and settings.py."
            )
        self.client = genai.Client(api_key=api_key)

    # ------------------------------------------------------------------
    # Scene detection (OpenCV)
    # ------------------------------------------------------------------
    def _detect_scenes(self, video_path, sample_every_n_frames=15):
        """Detect scene changes by comparing consecutive sampled frames."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        scenes = []
        prev_frame = None
        frame_idx = 0
        scene_start = 0.0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_every_n_frames == 0:
                small = cv2.resize(frame, (160, 90))
                gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
                gray = cv2.GaussianBlur(gray, (5, 5), 0)

                if prev_frame is not None:
                    diff = cv2.absdiff(prev_frame, gray)
                    score = float(np.mean(diff))

                    current_time = frame_idx / fps
                    scene_length = current_time - scene_start

                    if score > self.SCENE_THRESHOLD and scene_length >= self.MIN_CLIP_LENGTH:
                        scenes.append((scene_start, current_time))
                        scene_start = current_time

                prev_frame = gray

            frame_idx += 1

        cap.release()

        if duration > scene_start:
            scenes.append((scene_start, duration))

        if not scenes:
            scenes = [(0.0, duration)]

        # Merge short scenes
        merged = []
        for start, end in scenes:
            if merged and (end - start) < self.MIN_CLIP_LENGTH:
                merged[-1] = (merged[-1][0], end)
            else:
                merged.append((start, end))

        # Split long scenes
        final = []
        for start, end in merged:
            length = end - start
            if length > self.MAX_CLIP_LENGTH:
                n = int(length // self.MAX_CLIP_LENGTH) + 1
                step = length / n
                for i in range(n):
                    final.append((start + i * step, start + (i + 1) * step))
            else:
                final.append((start, end))

        return final

    # ------------------------------------------------------------------
    # Frame extraction + AI
    # ------------------------------------------------------------------
    def _extract_frame_at(self, video_path, time_seconds):
        """Grab the frame at the given timestamp."""
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(time_seconds * fps))
        ret, frame = cap.read()
        cap.release()
        return frame if ret else None

    def _frame_to_bytes(self, frame):
        """Encode a frame as JPEG bytes, resized to keep API calls cheap."""
        h, w = frame.shape[:2]
        if w > 800:
            scale = 800 / w
            frame = cv2.resize(frame, (800, int(h * scale)))
        ok, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if not ok:
            raise ValueError("Could not encode frame as JPEG")
        return buffer.tobytes()

    def _describe_frame(self, frame, time_seconds):
        """Send a frame to Gemini and get a short description."""
        try:
            img_bytes = self._frame_to_bytes(frame)

            prompt = (
                "Describe what is happening in this video frame in one concise sentence. "
                "Focus on the main action, people, objects, and setting. "
                "Do not start with 'This image shows' or 'In this frame'. "
                "Be specific and factual. Maximum 20 words."
            )

            response = self.client.models.generate_content(
                model=self.MODEL_NAME,
                contents=[
                    prompt,
                    types.Part.from_bytes(
                        data=img_bytes,
                        mime_type='image/jpeg',
                    ),
                ],
            )

            text = getattr(response, 'text', None)
            if not text:
                return f"Scene at {int(time_seconds)}s"

            return text.strip()

        except Exception as e:
            print(f"[AIAnnotator] Gemini error at {time_seconds}s: {e}")
            return f"Scene at {int(time_seconds)}s (description unavailable)"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def annotate(self, video_path, video_duration):
        """
        Full pipeline:
        1. Detect scenes with OpenCV
        2. Grab a representative frame from each
        3. Describe each frame with Gemini
        4. Return list of clip dicts
        """
        print(f"[AIAnnotator] Detecting scenes in {video_path}")
        scenes = self._detect_scenes(video_path)
        print(f"[AIAnnotator] Found {len(scenes)} scenes")

        clips = []
        for start, end in scenes:
            mid = (start + end) / 2
            frame = self._extract_frame_at(video_path, mid)

            if frame is None:
                description = f"Scene from {int(start)}s to {int(end)}s"
            else:
                description = self._describe_frame(frame, mid)

            clips.append({
                'start_time': round(start, 2),
                'end_time': round(end, 2),
                'description': description,
                'confidence_score': 0.75,
            })

        return clips