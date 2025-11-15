// API Base URL - configure via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Types matching your backend DTOs
export interface Student {
  id: string;
  externalId: string;
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
  classId: string;
  timestamp: string;
  confidence: number;
}

export interface RecognizedStudent {
  student_id: string;
  confidence: number;
  position: string;
}

// Student API
export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    const res = await fetch(`${API_BASE_URL}/students`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  getById: async (id: string): Promise<Student> => {
    const res = await fetch(`${API_BASE_URL}/students/${id}`);
    if (!res.ok) throw new Error('Failed to fetch student');
    return res.json();
  },

  create: async (data: Omit<Student, 'id'>): Promise<Student> => {
    const res = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create student');
    return res.json();
  },

  update: async (id: string, data: Partial<Student>): Promise<Student> => {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update student');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete student');
  },

  uploadPhoto: async (id: string, photo: File): Promise<void> => {
    const formData = new FormData();
    formData.append('image', photo);
    const res = await fetch(`${API_BASE_URL}/students/${id}/upload-photo`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload photo');
  },
};

// Class API
export const classApi = {
  getAll: async (): Promise<Class[]> => {
    const res = await fetch(`${API_BASE_URL}/classes`);
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
  },

  getById: async (id: string): Promise<Class> => {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`);
    if (!res.ok) throw new Error('Failed to fetch class');
    return res.json();
  },

  create: async (data: Omit<Class, 'id'>): Promise<Class> => {
    const res = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create class');
    return res.json();
  },

  update: async (id: string, data: Partial<Class>): Promise<Class> => {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update class');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete class');
  },

  getRoster: async (classId: string): Promise<Student[]> => {
    const res = await fetch(`${API_BASE_URL}/classes/${classId}/roster`);
    if (!res.ok) throw new Error('Failed to fetch roster');
    return res.json();
  },

  addStudent: async (classId: string, studentId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/classes/${classId}/add-student/${studentId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to add student to class');
  },
};

// Attendance API
export const attendanceApi = {
  submitFrame: async (image: File, classId: string): Promise<{ recognized: RecognizedStudent[] }> => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('classId', classId);
    const res = await fetch(`${API_BASE_URL}/camera/frame`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to submit frame');
    return res.json();
  },

  getByClass: async (classId: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_BASE_URL}/attendance/class/${classId}`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  getByClassToday: async (classId: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_BASE_URL}/attendance/class/${classId}/today`);
    if (!res.ok) throw new Error('Failed to fetch today attendance');
    return res.json();
  },

  getByStudent: async (studentId: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_BASE_URL}/attendance/student/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch student attendance');
    return res.json();
  },

  mark: async (data: { classId: string; studentId: string; confidence: number }): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to mark attendance');
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string }> => {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
};
