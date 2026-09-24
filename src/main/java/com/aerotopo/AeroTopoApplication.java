package com.aerotopo;

import com.aerotopo.config.SurveyProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(SurveyProperties.class)
@EnableCaching
@EnableAsync
@EnableScheduling
public class AeroTopoApplication {
    public static void main(String[] args) {
        SpringApplication.run(AeroTopoApplication.class, args);
    }
}
