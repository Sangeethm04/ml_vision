package com.ml_vision.ml_vision_backend.controllers;

import com.ml_vision.ml_vision_backend.dto.AttendanceRecordResponse;
import com.ml_vision.ml_vision_backend.dto.BatchRecognizedPayload;
import com.ml_vision.ml_vision_backend.dto.MlRecognizedStudent;
import com.ml_vision.ml_vision_backend.services.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/batch")
    public ResponseEntity<?> batch(
            @RequestParam("classId") String classId,
            @RequestParam("sessionId") String sessionId,
            @RequestParam(value = "sessionStartedAt", required = false) String sessionStartedAtRaw,
            @RequestBody BatchRecognizedPayload payload) {
        java.util.List<AttendanceRecordResponse> saved = new java.util.ArrayList<>();
        LocalDateTime sessionStartedAt = parseToEastern(sessionStartedAtRaw);
        for (MlRecognizedStudent r : payload.getRecognized()) {
            var record = attendanceService.recordAttendance(classId, sessionId, sessionStartedAt, r);
            if (record != null) {
                saved.add(AttendanceRecordResponse.fromEntity(record));
            }
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<java.util.List<AttendanceRecordResponse>> getByClass(
            @PathVariable String classId,
            @RequestParam(value = "sessionId", required = false) String sessionId) {
        return ResponseEntity.ok(attendanceService.getAttendanceForClass(classId, sessionId));
    }

    @GetMapping("/class/{classId}/today")
    public ResponseEntity<java.util.List<AttendanceRecordResponse>> getByClassToday(
            @PathVariable String classId) {
        return ResponseEntity.ok(attendanceService.getAttendanceForClassToday(classId, ZoneId.of("America/New_York")));
    }

    @PostMapping("/mark-absent")
    public ResponseEntity<java.util.List<AttendanceRecordResponse>> markAbsent(
            @RequestParam("classId") String classId,
            @RequestParam("sessionId") String sessionId,
            @RequestParam(value = "sessionStartedAt", required = false) String sessionStartedAtRaw) {
        LocalDateTime sessionStartedAt = parseToEastern(sessionStartedAtRaw);
        return ResponseEntity.ok(attendanceService.markAbsences(classId, sessionId, sessionStartedAt));
    }

    private LocalDateTime parseToEastern(String raw) {
        if (raw == null) return null;
        return OffsetDateTime.parse(raw)
                .atZoneSameInstant(ZoneId.of("America/New_York"))
                .toLocalDateTime();
    }
}
