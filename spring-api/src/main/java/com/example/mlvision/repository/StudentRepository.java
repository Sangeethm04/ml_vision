package com.example.mlvision.repository;

import com.example.mlvision.entity.Student;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, UUID> {
    Optional<Student> findByExternalCode(String externalCode);
}
