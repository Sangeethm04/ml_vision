package com.ml_vision.ml_vision_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MlRecognizedStudent {

    @JsonProperty("student_id")
    private String studentId;

    private double confidence;

    private String position;
}
