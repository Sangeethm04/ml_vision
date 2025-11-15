package com.ml_vision.ml_vision_backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @UuidGenerator
    private String id;

    @Column(unique = true, nullable = false)
    private String externalId;

    private String firstName;
    private String lastName;
    private String email;
    private String photoUrl;

    private LocalDateTime createdAt;
}
