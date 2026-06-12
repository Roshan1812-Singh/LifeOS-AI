package com.lifeos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Entry point for the LifeOS AI backend.
 *
 * <p>The application is organised into feature modules (auth, user, ai, task,
 * calendar, document, expense, notification, storage) sharing common
 * cross-cutting concerns (security, common). This keeps the codebase ready to
 * split into microservices later without rewriting business logic.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableJpaAuditing
public class LifeOsApplication {

    public static void main(String[] args) {
        SpringApplication.run(LifeOsApplication.class, args);
    }
}
