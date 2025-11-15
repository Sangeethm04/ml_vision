package com.ml_vision.ml_vision_backend.repositories;

import com.ml_vision.ml_vision_backend.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, String> {
    boolean existsByStudentAndCourseClassAndTimestampBetween(
            Student student,
            CourseClass courseClass,
            LocalDateTime start,
            LocalDateTime end);
}
