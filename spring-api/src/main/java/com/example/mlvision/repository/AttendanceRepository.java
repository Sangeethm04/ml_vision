package com.example.mlvision.repository;

import com.example.mlvision.entity.AttendanceRecord;
import com.example.mlvision.entity.ClassSession;
import com.example.mlvision.entity.Student;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {
    Optional<AttendanceRecord> findFirstByStudentAndSession(Student student, ClassSession session);

    List<AttendanceRecord> findBySession(ClassSession session);

    long countBySessionAndPresentIsTrue(ClassSession session);

    long countBySession(ClassSession session);

    List<AttendanceRecord> findBySessionAndTimestampBetween(
            ClassSession session, OffsetDateTime start, OffsetDateTime end);
}
