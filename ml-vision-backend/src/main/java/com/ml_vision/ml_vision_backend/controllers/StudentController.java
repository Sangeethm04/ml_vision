package com.ml_vision.ml_vision_backend.controllers;

import com.ml_vision.ml_vision_backend.dto.CreateStudentRequest;
import com.ml_vision.ml_vision_backend.entities.Student;
import com.ml_vision.ml_vision_backend.repositories.StudentRepository;
import com.ml_vision.ml_vision_backend.services.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final StudentRepository studentRepo;

    @PostMapping
    public Student create(@RequestBody CreateStudentRequest req) {
        return studentService.create(req);
    }

    @GetMapping
    public List<Student> getAll() {
        return studentRepo.findAll();
    }
}
