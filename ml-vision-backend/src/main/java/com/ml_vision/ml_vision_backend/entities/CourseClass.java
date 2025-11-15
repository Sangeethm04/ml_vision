package com.ml_vision.ml_vision_backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "course_classes")
@Data
public class CourseClass {

    @Id
    @UuidGenerator
    private String id;

    private String name;
    private String code;
    private String description;
}
