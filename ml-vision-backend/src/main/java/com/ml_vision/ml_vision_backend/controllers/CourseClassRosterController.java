package com.ml_vision.ml_vision_backend.controllers;

import com.ml_vision.ml_vision_backend.services.RosterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class CourseClassRosterController {

    private final RosterService rosterService;

    @GetMapping("/{classId}/roster")
    public ResponseEntity<List<?>> getRoster(@PathVariable String classId) {
        return ResponseEntity.ok(rosterService.getRoster(classId));
    }

    @PostMapping("/{classId}/roster/{externalId}")
    public ResponseEntity<?> addToRoster(
            @PathVariable String classId,
            @PathVariable String externalId) {
        rosterService.addStudent(classId, externalId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{classId}/roster/{externalId}")
    public ResponseEntity<?> removeFromRoster(
            @PathVariable String classId,
            @PathVariable String externalId) {
        rosterService.removeStudent(classId, externalId);
        return ResponseEntity.ok().build();
    }
}
