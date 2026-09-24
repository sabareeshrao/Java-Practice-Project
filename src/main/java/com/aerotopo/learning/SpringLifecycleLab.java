package com.aerotopo.learning;
import jakarta.annotation.*;
import org.springframework.beans.factory.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.context.annotation.*;
import org.springframework.context.*;
import org.springframework.core.env.Environment;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Configuration
@Profile("learning")
public class SpringLifecycleLab {
    public record Datum(String name) {}
    @Bean @Primary Datum wgs84() { return new Datum("WGS84"); }
    @Bean("legacyDatum") Datum legacy() { return new Datum("Everest"); }
    @Bean @Scope("prototype") CaptureSession captureSession() { return new CaptureSession(); }
    @Bean Lifecycle lifecycle(ObjectProvider<CaptureSession> provider,@Qualifier("legacyDatum") Datum datum) {
        return new Lifecycle(provider,datum);
    }
    public static final class CaptureSession { public final UUID id=UUID.randomUUID(); }
    public static final class Lifecycle implements InitializingBean,DisposableBean,ApplicationContextAware {
        private final ObjectProvider<CaptureSession> provider;
        private final Datum datum;
        private final List<String> events=new CopyOnWriteArrayList<>();
        public Lifecycle(ObjectProvider<CaptureSession> provider,Datum datum) { this.provider=provider;this.datum=datum;events.add("constructor"); }
        @Override public void setApplicationContext(ApplicationContext context) { events.add("context"); }
        @PostConstruct public void postConstruct() { events.add("postConstruct"); }
        @Override public void afterPropertiesSet() { events.add("afterPropertiesSet"); }
        @PreDestroy public void preDestroy() { events.add("preDestroy"); }
        @Override public void destroy() { events.add("destroy"); }
        public CaptureSession newSession() { return provider.getObject(); }
        public List<String> events() { return List.copyOf(events); }
        public String datum() { return datum.name(); }
    }
}
