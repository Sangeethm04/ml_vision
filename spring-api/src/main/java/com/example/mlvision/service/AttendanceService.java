package com.example.mlvision.service;

import com.example.mlvision.dto.AttendanceRequest;
import com.example.mlvision.dto.AttendanceResponse;
import com.example.mlvision.entity.AttendanceRecord;
import com.example.mlvision.entity.ClassSession;
import com.example.mlvision.entity.Student;
import com.example.mlvision.repository.AttendanceRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentService studentService;
    private final SessionService sessionService;

    @Transactional
    public AttendanceResponse markAttendance(AttendanceRequest request) {
        Student student = studentService.require(request.studentId());
        ClassSession session = sessionService.require(request.sessionId());
        AttendanceRecord record =
                attendanceRepository
                        .findFirstByStudentAndSession(student, session)
                        .orElseGet(() -> createRecord(student, session));

        record.setTimestamp(request.timestamp());
        record.setConfidence(request.confidence());
        record.setPresent(request.present());
        AttendanceRecord saved = attendanceRepository.save(record);
        return toDto(saved);
    }

    public List<AttendanceResponse> listBySession(UUID sessionId) {
        ClassSession session = sessionService.require(sessionId);
        return attendanceRepository.findBySession(session).stream().map(this::toDto).toList();
    }

    private AttendanceRecord createRecord(Student student, ClassSession session) {
        AttendanceRecord record = new AttendanceRecord();
        record.setStudent(student);
        record.setSession(session);
        return record;
    }

    private AttendanceResponse toDto(AttendanceRecord record) {
        return new AttendanceResponse(
                record.getId(),
                record.getStudent().getId(),
                record.getSession().getId(),
                record.getTimestamp(),
                record.getConfidence() == null ? 0.0 : record.getConfidence(),
                Boolean.TRUE.equals(record.getPresent()));
    }
}
