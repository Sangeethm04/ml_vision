package com.example.mlvision.controller;

import com.example.mlvision.dto.SessionDto;
import com.example.mlvision.service.SessionService;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping("/active")
    public List<SessionDto> active() {
        return sessionService.listActive(OffsetDateTime.now());
    }

    @GetMapping("/{id}")
    public SessionDto get(@PathVariable UUID id) {
        return sessionService.get(id);
    }

    @PostMapping
    public ResponseEntity<SessionDto> create(@Valid @RequestBody SessionDto dto) {
        SessionDto created = sessionService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
