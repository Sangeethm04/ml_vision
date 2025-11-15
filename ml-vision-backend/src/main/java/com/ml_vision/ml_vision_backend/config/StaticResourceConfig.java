package com.ml_vision.ml_vision_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Absolute folder on disk
        String baseDir = System.getProperty("user.dir") + "/uploads/student_photos/";

        registry
                .addResourceHandler("/uploads/student_photos/**")
                .addResourceLocations("file:" + baseDir);
    }
}
