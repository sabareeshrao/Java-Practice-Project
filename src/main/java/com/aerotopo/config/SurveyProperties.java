package com.aerotopo.config;

import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("survey")
public record SurveyProperties(@Min(1) @Max(100000) int maxPoints,
                               @DecimalMin("0.001") double verticalTolerance,
                               @Min(32601) @Max(32660) int srid) {}
