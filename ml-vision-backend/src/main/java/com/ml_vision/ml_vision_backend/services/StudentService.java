package com.ml_vision.ml_vision_backend.services;

import com.ml_vision.ml_vision_backend.entities.Student;
import com.ml_vision.ml_vision_backend.repositories.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
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
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${python.reload.url:http://localhost:5001/reload}")
    private String pythonReloadUrl;

    private static final String RELATIVE_UPLOAD_DIR = "/uploads/student_photos/";

    public Student createStudent(
            String firstName,
            String lastName,
            String externalId,
            String email,
            MultipartFile photo) {

        Student student = new Student();
        student.setFirstName(firstName);
        student.setLastName(lastName);
        student.setExternalId(externalId);
        student.setEmail(email);

        if (photo != null && !photo.isEmpty()) {
            student.setPhotoUrl(savePhoto(photo, externalId));
        }

        Student saved = studentRepository.save(student);
        notifyPythonReload();
        return saved;
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

        if (photo != null && !photo.isEmpty()) {
            student.setPhotoUrl(savePhoto(photo, externalId));
        }

        Student saved = studentRepository.save(student);
        notifyPythonReload();
        return saved;
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

    private String savePhoto(MultipartFile file, String externalId) {
        try {
            String rootDir = System.getProperty("user.dir");
            String fullUploadPath = rootDir + RELATIVE_UPLOAD_DIR;

            Files.createDirectories(Paths.get(fullUploadPath));

            String ext = getExtension(file.getOriginalFilename());
            String fileName = externalId + ext;

            File dest = new File(fullUploadPath + fileName);
            if (dest.exists()) {
                dest.delete();
            }
            file.transferTo(dest);

            return RELATIVE_UPLOAD_DIR + fileName;

        } catch (IOException e) {
            throw new RuntimeException("Failed to save photo", e);
        }
    }

    private String getExtension(String name) {
        if (name == null || !name.contains(".")) {
            return ".jpg";
        }
        return name.substring(name.lastIndexOf("."));
    }

    private void notifyPythonReload() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(pythonReloadUrl, HttpMethod.POST, entity, String.class);
            System.out.println("Notified python reload: " + response.getStatusCode());
        } catch (Exception ex) {
            System.err.println("Failed to notify python reload: " + ex.getMessage());
        }
    }
}
