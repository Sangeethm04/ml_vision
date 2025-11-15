package com.ml_vision.ml_vision_backend.services;

import com.ml_vision.ml_vision_backend.entities.Student;
import com.ml_vision.ml_vision_backend.repositories.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    private static final String UPLOAD_DIR = "uploads/student_photos/";

    public Student createStudent(
            String firstName,
            String lastName,
            String externalId,
            String email,
            MultipartFile photo) {

        String photoUrl = null;

        if (photo != null && !photo.isEmpty()) {
            photoUrl = savePhoto(photo);
        }

        Student student = Student.builder()
                .firstName(firstName)
                .lastName(lastName)
                .externalId(externalId)
                .email(email)
                .photoUrl(photoUrl)
                .build();

        return studentRepository.save(student);
    }

    public Student updateStudent(
            String id,
            String firstName,
            String lastName,
            String externalId,
            String email,
            MultipartFile photo) {

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setFirstName(firstName);
        student.setLastName(lastName);
        student.setExternalId(externalId);
        student.setEmail(email);

        // If a new photo is uploaded, replace old one
        if (photo != null && !photo.isEmpty()) {
            String newPhotoUrl = savePhoto(photo);
            student.setPhotoUrl(newPhotoUrl);
        }

        return studentRepository.save(student);
    }

    public Iterable<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudent(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    public void deleteStudent(String id) {
        studentRepository.deleteById(id);
    }

    // ----------------------
    // PHOTO HANDLING
    // ----------------------

    private String savePhoto(MultipartFile file) {

        try {
            // Absolute path: write to project root
            String rootDir = System.getProperty("user.dir");
            String fullUploadPath = rootDir + "/uploads/student_photos/";

            // Ensure directories exist
            Files.createDirectories(Paths.get(fullUploadPath));

            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;

            File dest = new File(fullUploadPath + filename);
            file.transferTo(dest);

            // URL for frontend
            return "/uploads/student_photos/" + filename;

        } catch (IOException e) {
            throw new RuntimeException("Failed to save photo", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
