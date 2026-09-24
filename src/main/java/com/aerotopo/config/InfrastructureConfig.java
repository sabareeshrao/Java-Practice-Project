package com.aerotopo.config;

import org.springframework.context.annotation.*;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.time.Clock;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class InfrastructureConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }
    @Bean("surveyExecutor")
    TaskExecutor surveyExecutor() {
        var executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("survey-");
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(32);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        return executor;
    }
}
