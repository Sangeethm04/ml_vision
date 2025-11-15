package com.example.mlvision.service;

import com.example.mlvision.dto.StudentDto;
import com.example.mlvision.entity.Student;
import com.example.mlvision.repository.StudentRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository repository;

    public List<StudentDto> list() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public StudentDto create(StudentDto dto) {
        Student student = new Student();
        student.setExternalCode(dto.externalCode());
        student.setFirstName(dto.firstName());
        student.setLastName(dto.lastName());
        student.setEmail(dto.email());
        Student saved = repository.save(student);
        return toDto(saved);
    }

    public Student require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Student not found"));
    }

    private StudentDto toDto(Student student) {
        return new StudentDto(student.getId(), student.getExternalCode(), student.getFirstName(), student.getLastName(), student.getEmail());
    }
}
