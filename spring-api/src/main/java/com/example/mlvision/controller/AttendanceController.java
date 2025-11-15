package com.example.mlvision.controller;

import com.example.mlvision.dto.AttendanceRequest;
import com.example.mlvision.dto.AttendanceResponse;
import com.example.mlvision.service.AttendanceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<AttendanceResponse> mark(@Valid @RequestBody AttendanceRequest request) {
        AttendanceResponse response = attendanceService.markAttendance(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<AttendanceResponse> list(@RequestParam UUID sessionId) {
        return attendanceService.listBySession(sessionId);
    }
}
