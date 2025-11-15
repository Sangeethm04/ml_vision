package com.example.mlvision.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final String expectedApiKey;

    public ApiKeyAuthFilter(String expectedApiKey) {
        this.expectedApiKey = expectedApiKey;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (expectedApiKey == null || expectedApiKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String provided = request.getHeader("X-API-Key");
        if (provided == null || !provided.equals(expectedApiKey)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "API key missing or invalid");
            return;
        }
        Authentication authentication =
                new PreAuthenticatedAuthenticationToken("api-client", null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
