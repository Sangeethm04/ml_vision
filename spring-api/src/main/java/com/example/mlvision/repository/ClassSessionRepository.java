package com.example.mlvision.repository;

import com.example.mlvision.entity.ClassSession;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassSessionRepository extends JpaRepository<ClassSession, UUID> {
    List<ClassSession> findByStartTimeBeforeAndEndTimeAfter(OffsetDateTime start, OffsetDateTime end);
}
