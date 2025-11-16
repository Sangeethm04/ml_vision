package com.ml_vision.ml_vision_backend.services;

import com.ml_vision.ml_vision_backend.entities.CourseClass;
import com.ml_vision.ml_vision_backend.entities.CourseClassRoster;
import com.ml_vision.ml_vision_backend.entities.Student;
import com.ml_vision.ml_vision_backend.repositories.CourseClassRepository;
import com.ml_vision.ml_vision_backend.repositories.CourseClassRosterRepository;
import com.ml_vision.ml_vision_backend.repositories.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RosterService {

    private final CourseClassRepository classRepo;
    private final StudentRepository studentRepo;
    private final CourseClassRosterRepository rosterRepo;

    public List<Student> getRoster(String classId) {
        return rosterRepo.findStudentsByCourseClassId(classId);
    }

    @Transactional
    public void addStudent(String classId, String externalId) {
        CourseClass cls = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        Student student = studentRepo.findByExternalId(externalId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        boolean exists = rosterRepo.existsByCourseClass_IdAndStudent_ExternalId(classId, externalId);
        if (exists)
            return;

        CourseClassRoster row = new CourseClassRoster();
        row.setCourseClass(cls);
        row.setStudent(student);

        rosterRepo.save(row);
    }

    @Transactional
    public void removeStudent(String classId, String externalId) {
        rosterRepo.deleteByCourseClass_IdAndStudent_ExternalId(classId, externalId);
    }
}
