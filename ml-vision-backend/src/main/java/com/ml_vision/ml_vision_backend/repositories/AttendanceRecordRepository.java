package com.ml_vision.ml_vision_backend.repositories;

import com.ml_vision.ml_vision_backend.entities.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, String> {
    boolean existsByStudentAndCourseClassAndTimestampBetween(
            Student student,
            CourseClass courseClass,
            LocalDateTime start,
            LocalDateTime end);

    List<AttendanceRecord> findByCourseClassIdOrderByTimestampDesc(String classId);

    boolean existsByStudentAndCourseClassAndSessionId(
            Student student,
            CourseClass courseClass,
            String sessionId
    );

    boolean existsByCourseClass_IdAndSessionIdAndStudent_ExternalId(
            String classId,
            String sessionId,
            String externalId
    );

    List<AttendanceRecord> findByCourseClassIdAndSessionIdOrderByTimestampDesc(
            String classId,
            String sessionId
    );

    List<AttendanceRecord> findByCourseClassIdAndTimestampBetweenOrderByTimestampDesc(
            String classId,
            LocalDateTime start,
            LocalDateTime end
    );
}
