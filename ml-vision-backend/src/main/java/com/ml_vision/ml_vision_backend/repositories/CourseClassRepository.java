package com.ml_vision.ml_vision_backend.repositories;

import com.ml_vision.ml_vision_backend.entities.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseClassRepository extends JpaRepository<CourseClass, String> {
}
