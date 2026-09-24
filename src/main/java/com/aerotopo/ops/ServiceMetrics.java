package com.aerotopo.ops;

import io.micrometer.core.instrument.*;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ServiceMetrics {
    private final MeterRegistry registry;
    public ServiceMetrics(MeterRegistry registry) { this.registry = registry; }
    @Around("execution(public * com.aerotopo.service.*.*(..))")
    public Object timed(ProceedingJoinPoint point) throws Throwable {
        Timer.Sample sample = Timer.start(registry);
        String outcome = "success";
        try { return point.proceed(); }
        catch (Throwable failure) { outcome = "failure"; throw failure; }
        finally {
            sample.stop(Timer.builder("survey.service.duration").tag("operation", point.getSignature().getName())
                    .tag("outcome", outcome).register(registry));
        }
    }
}
