package com.ml_vision.ml_vision_backend.services;

import com.ml_vision.ml_vision_backend.dto.CreateStudentRequest;
import com.ml_vision.ml_vision_backend.entities.Student;
import com.ml_vision.ml_vision_backend.repositories.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    public Student create(CreateStudentRequest req) {
        Student student = Student.builder()
                .externalId(req.getExternalId())
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .photoUrl(req.getPhotoUrl())
                .createdAt(LocalDateTime.now())
                .build();
        return studentRepository.save(student);
    }
}
