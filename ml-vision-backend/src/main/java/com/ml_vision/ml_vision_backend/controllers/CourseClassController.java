package com.ml_vision.ml_vision_backend.controllers;

import com.ml_vision.ml_vision_backend.entities.CourseClass;
import com.ml_vision.ml_vision_backend.services.CourseClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class CourseClassController {

    private final CourseClassService service;

    @GetMapping
    public List<CourseClass> getAll() {
        return service.getAll();
    }

    @PostMapping
    public CourseClass create(@RequestBody CourseClass cls) {
        return service.create(cls);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseClass> getById(@PathVariable String id) {
        return ResponseEntity.of(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseClass> update(
            @PathVariable String id,
            @RequestBody CourseClass cls) {
        return ResponseEntity.of(service.update(id, cls));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
