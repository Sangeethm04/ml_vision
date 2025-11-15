package com.example.mlvision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AttendanceRequest(
        @NotNull UUID studentId,
        @NotNull UUID sessionId,
        @NotNull OffsetDateTime timestamp,
        double confidence,
        boolean present) {}
