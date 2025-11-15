package com.ml_vision.ml_vision_backend.services;

import com.ml_vision.ml_vision_backend.dto.MlRecognizedStudent;
import com.ml_vision.ml_vision_backend.entities.*;
import com.ml_vision.ml_vision_backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final StudentRepository studentRepo;
    private final CourseClassRepository classRepo;
    private final AttendanceRecordRepository recordRepo;
    private final CourseClassRosterRepository rosterRepo;

    public void recordAttendance(String classId, MlRecognizedStudent recognized) {

        // 1. Load class
        CourseClass courseClass = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        // 2. Load student by external ID
        Student student = studentRepo.findByExternalId(recognized.getStudent_id())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // 3. Ensure student is enrolled
        if (!rosterRepo.existsByCourseClassAndStudent(courseClass, student)) {
            throw new RuntimeException("Student not in roster");
        }

        // 4. Prevent duplicate attendance marks today
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.toLocalDate().atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        boolean alreadyMarked = recordRepo.existsByStudentAndCourseClassAndTimestampBetween(
                student, courseClass, start, end);

        if (alreadyMarked)
            return;

        // 5. Save new attendance record
        AttendanceRecord record = AttendanceRecord.builder()
                .student(student)
                .courseClass(courseClass)
                .timestamp(now)
                .confidence(recognized.getConfidence())
                .position(recognized.getPosition())
                .status(AttendanceStatus.PRESENT)
                .build();

        recordRepo.save(record);
    }
}
