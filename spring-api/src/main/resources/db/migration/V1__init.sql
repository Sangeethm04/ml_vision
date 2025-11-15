CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY,
    external_code VARCHAR(64) UNIQUE,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    email VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY,
    course_code VARCHAR(64),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    session_id UUID REFERENCES class_sessions(id),
    timestamp TIMESTAMPTZ,
    confidence DOUBLE PRECISION,
    present BOOLEAN,
    status_reason VARCHAR(128),
    CONSTRAINT uq_attendance UNIQUE (student_id, session_id)
);
