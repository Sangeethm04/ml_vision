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
public class AttendanceRecord {

    @Id
    @UuidGenerator
    private String id;

    @ManyToOne
    private Student student;

    @ManyToOne
    private CourseClass courseClass;

    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus status;

    private double confidence;
    private String position;

    // identifies a capture session (e.g., each time "Start Capture" is pressed)
    private String sessionId;
    private LocalDateTime sessionStartedAt;
}
