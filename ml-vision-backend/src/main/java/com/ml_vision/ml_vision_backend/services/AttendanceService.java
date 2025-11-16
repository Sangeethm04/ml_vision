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

        CourseClass courseClass = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        Student student = studentRepo.findByExternalId(recognized.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // verify enrollment
        boolean inRoster = rosterRepo.existsByCourseClassIdAndStudentExternalId(
                classId, student.getExternalId());

        if (!inRoster)
            throw new RuntimeException("Student not in roster");

        // restrict one per day
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.toLocalDate().atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        boolean exists = recordRepo.existsByStudentAndCourseClassAndTimestampBetween(
                student, courseClass, start, end);

        if (exists)
            return;

        AttendanceRecord record = new AttendanceRecord();
        record.setStudent(student);
        record.setCourseClass(courseClass);
        record.setTimestamp(now);
        record.setConfidence(recognized.getConfidence());
        record.setPosition(recognized.getPosition());
        record.setStatus(AttendanceStatus.PRESENT);

        recordRepo.save(record);
    }
}
