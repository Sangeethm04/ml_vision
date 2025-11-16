package com.ml_vision.ml_vision_backend.services;

import com.ml_vision.ml_vision_backend.dto.AttendanceRecordResponse;
import com.ml_vision.ml_vision_backend.dto.MlRecognizedStudent;
import com.ml_vision.ml_vision_backend.entities.*;
import com.ml_vision.ml_vision_backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final StudentRepository studentRepo;
    private final CourseClassRepository classRepo;
    private final AttendanceRecordRepository recordRepo;
    private final CourseClassRosterRepository rosterRepo;

    public AttendanceRecord recordAttendance(String classId, String sessionId, LocalDateTime sessionStartedAt,
            MlRecognizedStudent recognized) {

        CourseClass courseClass = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        Student student = studentRepo.findByExternalId(recognized.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // verify enrollment
        boolean inRoster = rosterRepo.existsByCourseClass_IdAndStudent_ExternalId(
                classId, student.getExternalId());

        if (!inRoster) {
            // skip non-rostered students instead of failing the batch
            return null;
        }

        // restrict one per session
        boolean exists = recordRepo.existsByStudentAndCourseClassAndSessionId(
                student, courseClass, sessionId);

        if (exists)
            return null;

        LocalDateTime now = LocalDateTime.now();

        AttendanceRecord record = new AttendanceRecord();
        record.setStudent(student);
        record.setCourseClass(courseClass);
        record.setTimestamp(now);
        record.setConfidence(recognized.getConfidence());
        record.setPosition(recognized.getPosition());
        record.setStatus(AttendanceStatus.PRESENT);
        record.setSessionId(sessionId);
        record.setSessionStartedAt(sessionStartedAt != null ? sessionStartedAt : now);

        return recordRepo.save(record);
    }

    @Transactional
    public List<AttendanceRecordResponse> markAbsences(String classId, String sessionId, LocalDateTime sessionStartedAt) {
        CourseClass courseClass = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        LocalDateTime timestamp = sessionStartedAt != null ? sessionStartedAt : LocalDateTime.now();
        List<CourseClassRoster> roster = rosterRepo.findByCourseClassId(classId);

        List<AttendanceRecord> created = roster.stream()
                .filter(r -> !recordRepo.existsByCourseClass_IdAndSessionIdAndStudent_ExternalId(
                        classId, sessionId, r.getStudent().getExternalId()))
                .map(r -> {
                    AttendanceRecord rec = new AttendanceRecord();
                    rec.setCourseClass(courseClass);
                    rec.setStudent(r.getStudent());
                    rec.setTimestamp(timestamp);
                    rec.setStatus(AttendanceStatus.ABSENT);
                    rec.setSessionId(sessionId);
                    rec.setSessionStartedAt(sessionStartedAt != null ? sessionStartedAt : timestamp);
                    rec.setConfidence(0);
                    return rec;
                })
                .map(recordRepo::save)
                .collect(Collectors.toList());

        return created.stream()
                .map(AttendanceRecordResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AttendanceRecordResponse> getAttendanceForClass(String classId, String sessionId) {
        List<AttendanceRecord> records = sessionId == null
                ? recordRepo.findByCourseClassIdOrderByTimestampDesc(classId)
                : recordRepo.findByCourseClassIdAndSessionIdOrderByTimestampDesc(classId, sessionId);

        return records.stream()
                .map(AttendanceRecordResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AttendanceRecordResponse> getAttendanceForClassToday(String classId, ZoneId zoneId) {
        ZoneId zone = zoneId != null ? zoneId : ZoneId.systemDefault();
        LocalDateTime start = LocalDateTime.now(zone).toLocalDate().atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        return recordRepo.findByCourseClassIdAndTimestampBetweenOrderByTimestampDesc(classId, start, end)
                .stream()
                .map(AttendanceRecordResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
