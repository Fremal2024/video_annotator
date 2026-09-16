#  Video Annotator

An AI-powered web application that automatically analyzes uploaded videos, detects scene changes, and generates descriptive annotations for each segment using Google's Gemini vision model.

**Live Demo:** [video-annotator-frontend-g766.onrender.com](https://video-annotator-frontend-g766.onrender.com/)

> **Note:** The backend is hosted on Render's free tier, which spins down after 15 minutes of inactivity. The first request after a nap may take 30–60 seconds to respond.

---

##  Overview

Video Annotator solves a common problem: manually reviewing long videos to identify and label what happens in each scene is tedious. This app automates that workflow:

1. **Upload** any video file
2. **AI analyzes** the video by detecting scene changes and describing each one
3. **Review and edit** the generated annotations
4. **Seek** to any clip with one click

Built as a full-stack portfolio project demonstrating modern web development practices with Django, React, and Google Gemini.

---

##  Features

### Core Functionality
-  **JWT Authentication** — Register, login, logout with secure token-based auth
-  **Video Upload** — Drag-and-drop upload with real-time progress bar
-  **Automatic Scene Detection** — OpenCV analyzes frame-by-frame to find scene transitions
-  **AI-Powered Descriptions** — Google Gemini 3.6 Flash generates natural-language captions for each scene
-  **Precise Timestamps** — Each clip is marked with start and end times
-  **Manual Editing** — Add, edit, delete, or modify any AI-generated clip
-  **Interactive Player** — Click any clip to jump to that timestamp
-  **Video Management** — Delete videos and all associated clips

### Technical Highlights
- REST API with Django REST Framework
- Token-based authentication (SimpleJWT)
- Automatic duration extraction via OpenCV
- Media file handling with Django's storage system
- Responsive Material-UI design
- Error boundaries for graceful failure handling

---

##  Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Django 6.1** | Web framework |
| **Django REST Framework** | REST API |
| **SimpleJWT** | JWT authentication |
| **PostgreSQL** | Production database |
| **SQLite** | Local development database |
| **OpenCV** | Video processing & scene detection |
| **Google Gemini 3.6 Flash** | AI frame analysis |
| **WhiteNoise** | Static file serving |
| **Gunicorn** | Production WSGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Material-UI (MUI 6)** | Component library |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client |
| **HTML5 Video** | Native video playback |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Render** | Cloud hosting (backend + frontend + database) |
| **GitHub** | Version control |
| **Git** | Branching and deployment workflow |

---


**How AI annotation works:**
1. OpenCV samples frames at regular intervals and computes the mean pixel difference between consecutive samples.
2. When the difference exceeds a threshold, a new scene boundary is recorded.
3. For each detected scene, OpenCV extracts a representative frame from the middle.
4. The frame is sent to Gemini with a prompt asking for a one-sentence description.
5. Results are stored as `AnnotationClip` records in the database.
6. The React frontend fetches and displays them.

---

##  Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Git
- A Google Gemini API key ([get one free here](https://aistudio.google.com/apikey))

### 1. Clone the repository
```bash
git clone https://github.com/Fremal2024/video_annotator.git
cd video_annotator
```

# Backend Setup
1. Create and activate virtual environment
python -m venv venv

2. On Windows:
venv\Scripts\activate
3. On macOS/Linux:
source venv/bin/activate

4. Install dependencies
pip install -r requirements.txt

5. Create your .env file
Create a file named .env in the project root (same folder as manage.py):
--GEMINI_API_KEY=your_gemini_api_key_here
--DEBUG=True
--SECRET_KEY=any-random-string-for-dev

6. Run migrations
python manage.py migrate

7. Create a superuser
python manage.py createsuperuser

8. Start the backend
python manage.py runserver

# Frontend setup
- cd frontend
- npm install
- npm start

## Create media folders
In the project root:
- mkdir media
- mkdir media\videos
- mkdir media\thumbnails

# Test the app
Open http://localhost:3000, register an account, upload a video, and click Annotate.

# Project Structure
video_annotator/
│
├── api/                              # Django app — models, views, serializers
│   ├── models.py                     # Video, AnnotationClip
│   ├── serializers.py                # DRF serializers
│   ├── views.py                      # VideoViewSet with custom actions
│   ├── urls.py                       # Router configuration
│   └── auth_views.py                 # Register, login, current_user
│
├── video_annotation/                 # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── video_processor/                  # Video processing logic
│   └── ai_annotator.py               # Scene detection + Gemini integration
│
├── frontend/                         # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoUpload.js        # File picker + upload progress
│   │   │   └── VideoAnnotator.js     # Player + clip editor + AI trigger
│   │   ├── pages/
│   │   │   ├── Home.js               # Video list + upload
│   │   │   ├── Login.js              # Login form
│   │   │   ├── Register.js           # Registration form
│   │   │   └── VideoDetail.js        # Annotator wrapper page
│   │   ├── services/
│   │   │   ├── api.js                # Axios instance + videoService
│   │   │   └── auth.js               # JWT auth service
│   │   ├── App.js                    # Routing + theme + navbar
│   │   └── ErrorBoundary.js          # Catches render errors
│   └── package.json
│
├── media/                            # Uploaded videos (gitignored)
│   ├── videos/
│   └── thumbnails/
│
├── build.sh                          # Render build script
├── render.yaml                       # Render Blueprint (3 services)
├── requirements.txt                  # Python dependencies
├── manage.py                         # Django management entry point
├── .env                              # Environment variables (gitignored)
├── .gitignore
└── README.md


# API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Create a new user |
| `POST` | `/api/auth/login/` | Obtain JWT token |
| `GET` | `/api/auth/me/` | Get current user |
| `GET` | `/api/videos/` | List user's videos |
| `POST` | `/api/videos/` | Upload a new video |
| `GET` | `/api/videos/{id}/` | Get video with clips |
| `DELETE` | `/api/videos/{id}/` | Delete video |
| `POST` | `/api/videos/{id}/add_clip/` | Add manual clip |
| `POST` | `/api/videos/{id}/update_clip/` | Update a clip |
| `POST` | `/api/videos/{id}/delete_clip/` | Delete a clip |
| `POST` | `/api/videos/{id}/auto_annotate/` | Trigger AI annotation |

# Deployment
- This app is deployed on Render using a Blueprint (render.yaml).
## Services
- Backend: Django + Gunicorn (Python web service)
- Frontend: React static site
- Database: PostgreSQL (free tier)

## Deployment steps
1. Push code to GitHub
2. In Render dashboard: New+ → Blueprint → select repo
3. Render reads render.yaml and provisions all three services
4. Set GEMINI_API_KEY when prompted
5. Done

# Testing
1. Backend
- python manage.py test

2. Frontend
- cd frontend
- npm test

# Known Limitations
- Free tier sleep: Render spins down services after 15 minutes of inactivity
- No persistent disk on free tier: Uploaded videos are deleted on every redeploy
- Free PostgreSQL expires after 30 days on Render
- Scene detection threshold is fixed — future versions could make this configurable
- AI descriptions are in English only

# Future Improvements
- AWS S3 integration for persistent media storage
- Export annotations as SRT or JSON
- Search and filter across clips
- User collaboration (multiple annotators per video)
- Custom scene detection sensitivity slider
- Support for more AI providers (OpenAI, Anthropic, local models)
- Progress streaming via WebSockets
- Mobile-responsive improvements
- Dark/light theme toggle
- Multi-language AI descriptions

# License
This project is open source and available under the MIT License.

# Author
- Fred Muthoka
- GitHub: @Fremal2024
- Email: muthokafred804@gmail.com

# Acknowledgments
- Django REST Framework for the excellent API toolkit
- Material-UI for the polished component library
- Google AI Studio for the free Gemini API tier
- Render for the free full-stack hosting
> OpenCV for video processing capabilities

