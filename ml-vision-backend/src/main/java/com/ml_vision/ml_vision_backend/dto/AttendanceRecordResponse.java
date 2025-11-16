package com.ml_vision.ml_vision_backend.dto;

import com.ml_vision.ml_vision_backend.entities.AttendanceRecord;
import com.ml_vision.ml_vision_backend.entities.AttendanceStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class AttendanceRecordResponse {
    String id;
    String studentId;
    String studentExternalId;
    String studentName;
    String classId;
    String className;
    LocalDateTime timestamp;
    AttendanceStatus status;
    double confidence;
    String position;
    String sessionId;
    LocalDateTime sessionStartedAt;

    public static AttendanceRecordResponse fromEntity(AttendanceRecord record) {
        return AttendanceRecordResponse.builder()
                .id(record.getId())
                .studentId(record.getStudent().getId())
                .studentExternalId(record.getStudent().getExternalId())
                .studentName(record.getStudent().getFirstName() + " " + record.getStudent().getLastName())
                .classId(record.getCourseClass().getId())
                .className(record.getCourseClass().getName())
                .timestamp(record.getTimestamp())
                .status(record.getStatus())
                .confidence(record.getConfidence())
                .position(record.getPosition())
                .sessionId(record.getSessionId())
                .sessionStartedAt(record.getSessionStartedAt())
                .build();
    }
}
