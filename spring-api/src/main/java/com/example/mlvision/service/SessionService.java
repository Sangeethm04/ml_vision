package com.example.mlvision.service;

import com.example.mlvision.dto.SessionDto;
import com.example.mlvision.entity.ClassSession;
import com.example.mlvision.repository.ClassSessionRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final ClassSessionRepository repository;

    public List<SessionDto> listActive(OffsetDateTime timestamp) {
        return repository.findByStartTimeBeforeAndEndTimeAfter(timestamp, timestamp).stream()
                .map(this::toDto)
                .toList();
    }

    public SessionDto create(SessionDto dto) {
        ClassSession session = new ClassSession();
        session.setCourseCode(dto.courseCode());
        session.setStartTime(dto.startTime());
        session.setEndTime(dto.endTime());
        session.setLocation(dto.location());
        ClassSession saved = repository.save(session);
        return toDto(saved);
    }

    public ClassSession require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Session not found"));
    }

    public SessionDto get(UUID id) {
        return toDto(require(id));
    }

    private SessionDto toDto(ClassSession session) {
        return new SessionDto(session.getId(), session.getCourseCode(), session.getStartTime(), session.getEndTime(), session.getLocation());
    }
}
