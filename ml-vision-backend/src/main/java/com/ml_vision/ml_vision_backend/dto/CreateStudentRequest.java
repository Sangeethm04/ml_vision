package com.ml_vision.ml_vision_backend.dto;

import lombok.Data;

@Data
public class CreateStudentRequest {
    private String externalId;
    private String firstName;
    private String lastName;
    private String email;
    private String photoUrl;
}
