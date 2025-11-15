package com.ml_vision.ml_vision_backend.dto;

import lombok.Data;

@Data
public class AddStudentToClassRequest {
    private String classId;
    private String studentId;
}
