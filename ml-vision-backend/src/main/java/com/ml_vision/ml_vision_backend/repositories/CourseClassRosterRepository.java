package com.ml_vision.ml_vision_backend.repositories;

import com.ml_vision.ml_vision_backend.entities.CourseClass;
import com.ml_vision.ml_vision_backend.entities.CourseClassRoster;
import com.ml_vision.ml_vision_backend.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseClassRosterRepository extends JpaRepository<CourseClassRoster, String> {

    boolean existsByCourseClassAndStudent(CourseClass courseClass, Student student);
}
