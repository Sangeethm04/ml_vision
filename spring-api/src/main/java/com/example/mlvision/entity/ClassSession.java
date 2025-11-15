package com.example.mlvision.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "class_sessions")
@Getter
@Setter
public class ClassSession {

    @Id private UUID id = UUID.randomUUID();

    @Column(name = "course_code")
    private String courseCode;

    @Column(name = "start_time")
    private OffsetDateTime startTime;

    @Column(name = "end_time")
    private OffsetDateTime endTime;

    private String location;
}
