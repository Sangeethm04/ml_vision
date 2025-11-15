package com.example.mlvision.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SessionDto(UUID id, String courseCode, OffsetDateTime startTime, OffsetDateTime endTime, String location) {}
