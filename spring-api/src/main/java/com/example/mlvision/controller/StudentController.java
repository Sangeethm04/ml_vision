package com.example.mlvision.controller;

import com.example.mlvision.dto.StudentDto;
import com.example.mlvision.service.StudentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public List<StudentDto> list() {
        return studentService.list();
    }

    @PostMapping
    public ResponseEntity<StudentDto> create(@Valid @RequestBody StudentDto dto) {
        StudentDto created = studentService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
