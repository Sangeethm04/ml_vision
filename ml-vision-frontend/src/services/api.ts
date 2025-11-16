// ============================================================================
// API Base URL (Spring Boot)
// ============================================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// ============================================================================
// Types matching backend DTOs & entities
// ============================================================================

export interface Student {
  id: string;
  externalId: string; // ML uses this!
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentExternalId: string;
  studentName: string;
  classId: string;
  className: string;
  timestamp: string;
  confidence: number;
  status: string;
  position?: string;
  sessionId: string;
  sessionStartedAt: string;
}

export interface RecognizedStudent {
  student_id: string; // Python returns this (externalId)
  confidence: number;
  position: string;
}

// ============================================================================
// STUDENT API
// ============================================================================

export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    const res = await fetch(`${API_BASE_URL}/students`);
    if (!res.ok) throw new Error("Failed to fetch students");
    return res.json();
  },

  getById: async (id: string): Promise<Student> => {
    const res = await fetch(`${API_BASE_URL}/students/${id}`);
    if (!res.ok) throw new Error("Failed to fetch student");
    return res.json();
  },

  /** CREATE (multipart w/ photo) */
  createWithPhoto: async (formData: FormData): Promise<Student> => {
    const res = await fetch(`${API_BASE_URL}/students`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create student");
    return res.json();
  },

  /** UPDATE (multipart w/ photo) */
  updateWithPhoto: async (id: string, formData: FormData): Promise<Student> => {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: "PUT",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update student");
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete student");
  },
};

// ============================================================================
// CLASS + ROSTER API
// ============================================================================

export const classApi = {
  getAll: async (): Promise<Class[]> => {
    const res = await fetch(`${API_BASE_URL}/classes`);
    if (!res.ok) throw new Error("Failed to fetch classes");
    return res.json();
  },

  getById: async (id: string): Promise<Class> => {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`);
    if (!res.ok) throw new Error("Failed to fetch class");
    return res.json();
  },

  create: async (data: Omit<Class, "id">): Promise<Class> => {
    const res = await fetch(`${API_BASE_URL}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create class");
    return res.json();
  },

  update: async (id: string, data: Partial<Class>): Promise<Class> => {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update class");
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete class");
  },

  /** GET roster for a class */
  getRoster: async (classId: string): Promise<Student[]> => {
    const res = await fetch(`${API_BASE_URL}/classes/${classId}/roster`);
    if (!res.ok) throw new Error("Failed to fetch roster");
    return res.json();
  },

  /** ADD student to roster */
  addToRoster: async (classId: string, studentExternalId: string): Promise<void> => {
    const res = await fetch(
      `${API_BASE_URL}/classes/${classId}/roster/${studentExternalId}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Failed to add student to class");
  },

  /** REMOVE student from roster */
  removeFromRoster: async (
    classId: string,
    studentExternalId: string
  ): Promise<void> => {
    const res = await fetch(
      `${API_BASE_URL}/classes/${classId}/roster/${studentExternalId}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Failed to remove student from class");
  },
};

// ============================================================================
// ATTENDANCE API — Python Vision + Spring Backend
// ============================================================================

/** Step 1 — Send frame to Python ML */
async function sendToPython(file: File) {
  const fd = new FormData();
  fd.append("image", file);

  const res = await fetch("http://localhost:5001/recognize", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) throw new Error("Python recognition failed");
  return res.json(); // { recognized: [...] }
}

/** Step 2 — Send recognized list to Spring */
async function sendToSpring(
  classId: string,
  sessionId: string,
  sessionStartedAt: string,
  recognized: RecognizedStudent[]
) {
  const res = await fetch(
    `${API_BASE_URL}/attendance/batch?classId=${classId}&sessionId=${sessionId}&sessionStartedAt=${encodeURIComponent(
      sessionStartedAt
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recognized }),
    }
  );

  if (!res.ok) throw new Error("Spring attendance failed");
  return res.json();
}

export const attendanceApi = {
  /** Submit frame -> python -> spring */
  submitFrame: async (
    file: File,
    classId: string,
    sessionId: string,
    sessionStartedAt: string
  ): Promise<AttendanceRecord[]> => {
    const vision = await sendToPython(file);
    return await sendToSpring(classId, sessionId, sessionStartedAt, vision.recognized);
  },

  getByClass: async (classId: string, sessionId?: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(
      `${API_BASE_URL}/attendance/class/${classId}${sessionId ? `?sessionId=${sessionId}` : ""}`
    );
    if (!res.ok) throw new Error("Failed to fetch attendance");
    return res.json();
  },

  getByClassToday: async (classId: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(
      `${API_BASE_URL}/attendance/class/${classId}/today`
    );
    if (!res.ok) throw new Error("Failed to fetch today's attendance");
    return res.json();
  },

  getByStudent: async (studentId: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_BASE_URL}/attendance/student/${studentId}`);
    if (!res.ok) throw new Error("Failed to fetch student attendance");
    return res.json();
  },

  markAbsences: async (
    classId: string,
    sessionId: string,
    sessionStartedAt: string
  ): Promise<AttendanceRecord[]> => {
    const res = await fetch(
      `${API_BASE_URL}/attendance/mark-absent?classId=${classId}&sessionId=${sessionId}&sessionStartedAt=${encodeURIComponent(
        sessionStartedAt
      )}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Failed to mark absences");
    return res.json();
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthCheck = async (): Promise<{ status: string }> => {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
};
