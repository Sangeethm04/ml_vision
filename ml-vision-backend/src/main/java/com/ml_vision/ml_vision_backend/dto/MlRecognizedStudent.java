package com.ml_vision.ml_vision_backend.dto;

import lombok.Data;

@Data
public class MlRecognizedStudent {
    private String student_id;
    private double confidence;
    private String position;
}
