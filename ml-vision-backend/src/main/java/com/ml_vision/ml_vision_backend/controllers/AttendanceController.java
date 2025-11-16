package com.ml_vision.ml_vision_backend.controllers;

import com.ml_vision.ml_vision_backend.dto.BatchRecognizedPayload;
import com.ml_vision.ml_vision_backend.dto.MlRecognizedStudent;
import com.ml_vision.ml_vision_backend.services.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/batch")
    public ResponseEntity<?> batch(
            @RequestParam("classId") String classId,
            @RequestBody BatchRecognizedPayload payload) {
        for (MlRecognizedStudent r : payload.getRecognized()) {
            attendanceService.recordAttendance(classId, r);
        }
        return ResponseEntity.ok().body(payload);
    }
}
