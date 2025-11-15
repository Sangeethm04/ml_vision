package com.ml_vision.ml_vision_backend.services;

import com.ml_vision.ml_vision_backend.entities.CourseClass;
import com.ml_vision.ml_vision_backend.repositories.CourseClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseClassService {

    private final CourseClassRepository repo;

    public List<CourseClass> getAll() {
        return repo.findAll();
    }

    public CourseClass create(CourseClass cls) {
        return repo.save(cls);
    }

    public Optional<CourseClass> getById(String id) {
        return repo.findById(id);
    }

    public Optional<CourseClass> update(String id, CourseClass updated) {
        return repo.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setCode(updated.getCode());
            existing.setDescription(updated.getDescription());
            return repo.save(existing);
        });
    }

    public void delete(String id) {
        repo.deleteById(id);
    }
}
