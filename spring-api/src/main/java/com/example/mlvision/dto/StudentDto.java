package com.example.mlvision.dto;

import java.util.UUID;

public record StudentDto(UUID id, String externalCode, String firstName, String lastName, String email) {}
