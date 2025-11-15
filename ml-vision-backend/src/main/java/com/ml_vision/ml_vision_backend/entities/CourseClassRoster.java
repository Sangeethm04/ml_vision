package com.ml_vision.ml_vision_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "course_class_roster")
@Data
public class CourseClassRoster {

    @Id
    @UuidGenerator
    private String id;

    @ManyToOne
    @JoinColumn(name = "course_class_id")
    private CourseClass courseClass;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;
}
