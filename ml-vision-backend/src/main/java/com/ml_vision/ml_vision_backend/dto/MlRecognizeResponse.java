package com.ml_vision.ml_vision_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class MlRecognizeResponse {
    private List<MlRecognizedStudent> recognized;
}
