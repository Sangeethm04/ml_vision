package com.example.mlvision.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AttendanceResponse(
        UUID id, UUID studentId, UUID sessionId, OffsetDateTime timestamp, double confidence, boolean present) {}
