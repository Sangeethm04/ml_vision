# ML Vision Attendance Platform

End-to-end blueprint for a classroom attendance platform that combines a Python-based face-recognition pipeline with a Java Spring Boot REST API and a SQL database. The future front-end (web or mobile) can consume the same API to visualize attendance in real time.

---

## Running the app
docker-compose up -d
mvn spring-boot:run

## System Architecture

```
┌────────────────────┐        ┌────────────────────┐        ┌──────────────────────┐
│Python Vision Agent │  REST  │ Java Spring API    │  JDBC  │ SQL Database         │
│• Capture frames    │ ─────► │ • Students CRUD    │ ◄────► │ • students           │
│• Face recognition  │        │ • Sessions CRUD    │        │ • sessions           │
│• Attendance client │ ◄────┐ │ • Attendance POST  │        │ • attendance_records │
└────────────────────┘      │ │ • Auth/security    │        └──────────────────────┘
                             │ │
                             │ └───────────► Front-end SPA / mobile (future)
                             └─────────────► Admin scripts
```

Top-level directories:

```
ml_vision/
├── python-vision/         # Python attendance capture agent
│   ├── requirements.txt
│   ├── src/python_vision/ # capture, recognition, API client modules
│   └── tests/             # pytest suite
├── spring-api/            # Spring Boot REST API + Flyway migrations
│   ├── pom.xml
│   └── src/
└── README.md
```

---

## Getting Started

```bash
# Python agent
cd python-vision
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp example.env .env  # edit API_BASE_URL, API_KEY, SESSION_ID, etc.
python -m python_vision.main --source 0

# Spring API
cd spring-api
mvn spring-boot:run
```

Seed students/sessions via the exposed REST endpoints or by inserting directly into the SQL database.

---

## Python Face Recognition Service

Implementation lives under `python-vision/src/python_vision`.

### Responsibilities
1. Capture classroom imagery (webcam or uploaded still images/video).
2. Detect and recognize faces against a roster.
3. Resolve each recognized face to a student ID and call the Java API to mark attendance.
4. Retry failed API submissions and export logs for auditing.

### Suggested stack

| Concern              | Choice                                                             |
|----------------------|---------------------------------------------------------------------|
| Runtime              | Python 3.11                                                         |
| Image processing     | OpenCV for video/image ingestion                                    |
| Face detection       | `face_recognition` (dlib) or `opencv-python` Haar/SSD              |
| Embeddings store     | SQLite/JSON locally; roster fetched from API periodically           |
| HTTP                 | `requests` with exponential backoff                                |
| Configuration        | `.env` file parsed via `python-dotenv`                             |
| Testing              | `pytest` + fixtures for mock frames and API                        |

Example `requirements.txt`:
```
opencv-python==4.9.0.80
face-recognition==1.3.0
numpy==1.26.4
requests==2.31.0
python-dotenv==1.0.1
tenacity==8.2.3      # retries
pytest==8.2.0
```

### Core modules

* `capture.FrameCapture`: opens camera/video/directory and yields frames.
* `recognizer.FaceRecognizer` + `DeduplicatingRecognizer`: loads roster encodings and filters duplicates.
* `api_client.AttendanceApiClient`: wraps REST requests with retries + duplicate handling.
* `main`: CLI entry; accepts `--session-id`, `--source`, and `--mock-recognizer` for dry runs.

Minimal attendance payload:

```python
payload = {
    "studentId": student_id,
    "sessionId": session_id,
    "timestamp": datetime.utcnow().isoformat(),
    "confidence": confidence,
    "present": True
}
api_client.mark_attendance(payload)
```

### Workflow

1. `main.py` loads `.env` for `API_BASE_URL`, `API_TOKEN`, camera config.
2. Fetch current session + roster via `/api/sessions/{id}` and `/api/students`.
3. Start capture loop, run recognition, deduplicate by student/time window (e.g., ignore duplicates <2 minutes apart).
4. On recognition, call API. Store events locally (SQLite) for offline replay if network fails.
5. Expose CLI to run once (`python -m src.main --session-id 42 --snapshot path.jpg`) or continuous monitoring.

### Testing Guidelines

* Run `pytest` inside `python-vision`; sample dedupe unit test is included.
* Extend coverage with API mocks (`responses`) and prerecorded frames as needed.

---

## Java Spring Boot API

Implementation lives in `spring-api/src/main/java/com/example/mlvision`.

### Project setup

* Spring Boot 3.x, Java 17, Maven (`spring-api/pom.xml`).
* Dependencies: Spring Web, Data JPA, Validation, Security, Flyway, Postgres driver, springdoc OpenAPI.
* API key (header `X-API-Key`) configured via `app.api-key` in `application.yaml`.

### Domain model

| Entity            | Table / fields                                                                 |
|-------------------|--------------------------------------------------------------------------------|
| `Student`         | `students` table with `id`, `external_code`, `first_name`, `last_name`, `email` |
| `ClassSession`    | `class_sessions` table with `course_code`, `start_time`, `end_time`, `location` |
| `AttendanceRecord` | `attendance_records` linking `student_id` & `session_id`, timestamp, confidence, present flag |

Flyway migration (`spring-api/src/main/resources/db/migration/V1__init.sql`) creates the schema and enforces a unique `(student_id, session_id)` constraint so duplicate calls simply update the same record.

### Layers

* **Repositories**: `StudentRepository`, `ClassSessionRepository`, `AttendanceRepository`.
* **Services**: `StudentService`, `SessionService`, `AttendanceService` encapsulate lookups, dedupe logic, and DTO mapping.
* **Controllers**:
  * `/api/students` – list/create students.
  * `/api/sessions` – create + fetch by ID plus `/active`.
  * `/api/attendance` – POST for the Python client, GET filtered by session.
  * `RestExceptionHandler` converts `IllegalArgumentException` to HTTP 404 JSON.
* **Security**: `SecurityConfig` registers `ApiKeyAuthFilter` so only trusted clients can call the API. Swagger endpoints remain public.

### Sample Controller Snippet

```java
@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService service;

    @PostMapping
    public ResponseEntity<AttendanceDto> markAttendance(@Valid @RequestBody AttendanceRequest request) {
        AttendanceDto saved = service.markAttendance(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
```

### Integration with Front-end

* Publish OpenAPI spec via springdoc-openapi. Serve at `/swagger-ui.html`.
* Front-end can fetch session list, attendance, and student rosters through same API.
* Add WebSocket or Server-Sent Events endpoint `/ws/attendance/{sessionId}` to stream new attendance events to UI in real time (optional).

### Testing

* Unit tests for services using JUnit 5 + Mockito.
* Integration tests with `@SpringBootTest` + Testcontainers (PostgreSQL) verifying repository + controller flow.
* Include contract tests for API payloads consumed by Python app and front-end.

---

## Integration Flow

1. **Provision database**: create Postgres/MySQL instance; run Flyway migrations.
2. **Launch Spring API**: `mvn spring-boot:run`. Configure `application.yaml` with JDBC URL, credentials, API key.
3. **Seed data**: POST students and sessions via API or import script.
4. **Configure Python app**:
   * `.env` with `API_BASE_URL`, `API_KEY`, `SESSION_ID`, camera config.
   * Preload embeddings referencing student IDs (download from API or maintain offline mapping).
5. **Run Python agent**: `python -m src.main --session-id <uuid> --source camera`.
6. **Front-end (future)**: call `/api/sessions`, `/api/attendance`, subscribe to SSE for live updates.

Error handling guidelines:

* Python agent caches attendance events locally and retries when API/network recovers.
* API returns 409 for duplicate attendance; Python agent should treat as success.
* Use correlation IDs (`X-Request-Id`) for tracing across services.

---

## Deployment Options

* **Docker Compose**:
  * Service 1: `python-vision` container with camera passthrough or mounted footage.
  * Service 2: `spring-api` container built from Dockerfile.
  * Service 3: `postgres` with persisted volume.
* **Kubernetes**:
  * StatefulSet for Postgres, Deployments for API and Python agent. Use secrets for credentials.
* **Edge devices**:
  * Python agent runs on classroom computer (GPU optional). API + DB hosted centrally. Agent uses MQTT/WebSocket fallback if HTTP unavailable.

---

## Next Steps

1. Configure the actual Postgres connection details + API key in `spring-api/src/main/resources/application.yaml`.
2. Import/record baseline student photos into `python-vision/roster` (or fetch from an upstream system) so the recognizer can build embeddings.
3. Flesh out the OpenAPI contract (Spring doc already wired) and share with the upcoming front-end.
4. Add CI (GitHub Actions) to run `pytest` + `mvn test`, and wire deployment scripts (Docker Compose/K8s) when ready.
5. Iterate on the recognition threshold/lighting setup before rolling into a real classroom.
