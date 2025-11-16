package com.ml_vision.ml_vision_backend.repositories;

import com.ml_vision.ml_vision_backend.entities.CourseClassRoster;
import com.ml_vision.ml_vision_backend.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CourseClassRosterRepository extends JpaRepository<CourseClassRoster, String> {

    boolean existsByCourseClassIdAndStudentExternalId(String classId, String externalId);

    void deleteByCourseClassIdAndStudentExternalId(String classId, String externalId);

    @Query("""
        SELECT r.student
        FROM CourseClassRoster r
        WHERE r.courseClass.id = :classId
    """)
    List<Student> findStudentsByCourseClassId(String classId);
}
