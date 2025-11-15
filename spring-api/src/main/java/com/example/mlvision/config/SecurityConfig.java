package com.example.mlvision.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.api-key:}")
    private String apiKey;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(
                                                "/v3/api-docs/**",
                                                "/swagger-ui.html",
                                                "/swagger-ui/**",
                                                "/actuator/health")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())
                .httpBasic(Customizer.withDefaults());

        http.addFilterBefore(new ApiKeyAuthFilter(apiKey), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
