package com.ml_vision.ml_vision_backend.controllers;

import com.ml_vision.ml_vision_backend.entities.Student;
import com.ml_vision.ml_vision_backend.services.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    // ---------------------------
    // CREATE STUDENT (with photo)
    // ---------------------------
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Student createStudent(
            @RequestPart("firstName") String firstName,
            @RequestPart("lastName") String lastName,
            @RequestPart("externalId") String externalId,
            @RequestPart("email") String email,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return studentService.createStudent(firstName, lastName, externalId, email, photo);
    }

    // ---------------------------
    // UPDATE STUDENT
    // ---------------------------
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Student updateStudent(
            @PathVariable String id,
            @RequestPart("firstName") String firstName,
            @RequestPart("lastName") String lastName,
            @RequestPart("externalId") String externalId,
            @RequestPart("email") String email,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return studentService.updateStudent(id, firstName, lastName, externalId, email, photo);
    }

    // ---------------------------
    // GET ALL STUDENTS
    // ---------------------------
    @GetMapping
    public Iterable<Student> getAllStudents() {
        return studentService.getAllStudents();
    }

    // ---------------------------
    // GET SINGLE STUDENT
    // ---------------------------
    @GetMapping("/{id}")
    public Student getStudent(@PathVariable String id) {
        return studentService.getStudent(id);
    }

    // ---------------------------
    // DELETE STUDENT
    // ---------------------------
    @DeleteMapping("/{id}")
    public void deleteStudent(@PathVariable String id) {
        studentService.deleteStudent(id);
    }
}
