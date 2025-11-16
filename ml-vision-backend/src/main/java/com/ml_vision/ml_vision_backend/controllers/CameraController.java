package com.ml_vision.ml_vision_backend.controllers;

import com.ml_vision.ml_vision_backend.dto.*;
import com.ml_vision.ml_vision_backend.services.AttendanceService;
import com.ml_vision.ml_vision_backend.util.MultipartInputStreamFileResource;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/camera")
@RequiredArgsConstructor
public class CameraController {

    private final RestTemplate restTemplate;
    private final AttendanceService attendanceService;

    @Value("${attendance.ml.recognition-url}")
    private String mlUrl;

    @PostMapping("/frame")
    public ResponseEntity<?> submitFrame(@RequestParam("image") MultipartFile image,
            @RequestParam("classId") String classId,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestParam(value = "sessionStartedAt", required = false) String sessionStartedAtIso) throws Exception {

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new MultipartInputStreamFileResource(
                image.getInputStream(), image.getOriginalFilename()));
        body.add("classId", classId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ResponseEntity<MlRecognizeResponse> resp = restTemplate.exchange(
                mlUrl,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                MlRecognizeResponse.class);

        MlRecognizeResponse recognized = resp.getBody();

        if (recognized != null && recognized.getRecognized() != null) {
            LocalDateTime sessionStartedAt = null;
            if (sessionStartedAtIso != null && !sessionStartedAtIso.isBlank()) {
                try {
                    sessionStartedAt = LocalDateTime.parse(sessionStartedAtIso);
                } catch (Exception ignored) {
                    // fall back to null if parsing fails
                }
            }
            for (MlRecognizedStudent s : recognized.getRecognized()) {
                attendanceService.recordAttendance(classId, sessionId, sessionStartedAt, s);
            }
        }

        return ResponseEntity.ok(recognized);
    }
}
