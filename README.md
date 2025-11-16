# ML Vision – AI-Powered Attendance Platform

ML Vision automates classroom attendance using real-time facial recognition.  
This monorepo includes the full stack: a modern React frontend, a Spring Boot backend, and a Python vision engine powered by OpenCV + face_recognition.

---

## Repository Structure
- **ml-vision-frontend/** — React + Vite UI (Shadcn UI, TailwindCSS)  
- **ml-vision-backend/** — Spring Boot REST API + PostgreSQL  
- **python-vision/** — Python Flask recognizer + agent that syncs student photos and performs face matching  

---

## Quickstart

### Backend (Spring Boot + Postgres)
```bash
cd ml-vision-backend
# configure src/main/resources/application.yaml
mvn spring-boot:run
```

### Frontend (React + Vite)

```bash
cd ml-vision-frontend
npm install
npm run dev
# requires VITE_API_BASE_URL → e.g. http://localhost:8080/api
```

### Python Vision (Flask or Agent Mode)

```bash
cd python-vision
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp example.env .env  # set API_BASE_URL, SESSION_ID, FRAME_SOURCE, etc.

# Flask recognizer server (frontend sends image frames)
python -m python_vision.server   # http://localhost:5001/recognize

# Agent mode (continuous camera + direct attendance upload)
python -m python_vision.main --source 0 --session-id <uuid>
```

---

## Architecture Overview

```
React Frontend
     |
     v
Spring Boot API  <----->  Postgres
     |
     v
Python Flask /recognize  (face detection + matching)
```

**Core flow**

1. Frontend captures a video frame every second.
2. Frame → Python `/recognize` → returns `{ externalId, confidence }`.
3. Frontend sends batch to Spring `/api/attendance/batch`.
4. On session end, frontend triggers `/api/attendance/mark-absent` to finalize the report.

**Python vision engine**

* Syncs all student photos from Spring
* Generates face embeddings with `face_recognition`
* Matches faces and returns confidence scores

---

## Key Spring API Endpoints

### Attendance

* `POST /api/attendance/batch?classId&sessionId&sessionStartedAt`
* `POST /api/attendance/mark-absent?classId&sessionId&sessionStartedAt`
* `GET  /api/attendance/class/{classId}`
* `GET  /api/attendance/class/{classId}/today`

### Classes

* `GET/POST/PUT/DELETE /api/classes`
* `GET/POST/DELETE /api/classes/{classId}/roster/{externalId}`

### Students

* `GET /api/students`
* `POST /api/students` (multipart; includes photo upload)
* `PUT /api/students/{externalId}`
* `DELETE /api/students/{externalId}`

---

## Frontend Highlights

* **Live Attendance:** real-time camera feed + continuous face recognition
* **Students Module:** add/edit students, upload or capture live photos
* **Classes Module:** manage rosters, track present/absent counts
* **Reports:** session-based summaries with CSV export
* **Dashboard:** today’s attendance rate + latest session activity

---

## Python Vision Notes

* Automatically syncs roster photos from Spring
* Stores images as `{externalId}.jpg`
* `/reload` rebuilds embeddings after a student is added or updated
* Uses `FaceRecognizer` and `DeduplicatingRecognizer` to avoid duplicate detections

---

## Environment Variables

### Backend (`application.yaml`)

* DB URL, username, password
* `spring.jackson.time-zone: America/New_York`
* Optional: `python.reload.url`

### Frontend (`.env`)

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_VISION_BASE_URL=http://localhost:5001   # optional override
```

### Python (`.env`)

```
API_BASE_URL=http://localhost:8080/api
SESSION_ID=<uuid>
FRAME_SOURCE=0
ROSTER_DIR=python-vision/roster
```

---

## Developer Tips

* Restart the **Spring** server after schema or entity changes.
* Restart **Python** or call `/reload` after updating student photos.
* Use LAN IPs (e.g. `http://192.168.x.x`) for mobile testing.
* Keep student photo filenames consistent with their `externalId`.