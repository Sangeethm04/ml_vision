package com.ml_vision.ml_vision_backend.dto;

import lombok.Data;

@Data
public class CreateClassRequest {
    private String name;
    private String code;
    private String description;
}
