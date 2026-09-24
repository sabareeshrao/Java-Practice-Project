package com.aerotopo.learning;
import com.aerotopo.domain.SurveyPoint;
import java.io.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.*;

public final class PatternLab {
    public static final class DoubleCheckedRegistry implements Serializable {
        private static final long serialVersionUID=1L;
        private static volatile DoubleCheckedRegistry instance;
        private DoubleCheckedRegistry() {}
        public static DoubleCheckedRegistry instance() {
            if(instance==null) synchronized(DoubleCheckedRegistry.class) {
                if(instance==null) instance=new DoubleCheckedRegistry();
            }
            return instance;
        }
        private Object readResolve() { return instance(); }
    }
    public static final class HolderRegistry {
        private HolderRegistry() {}
        private static class Holder { private static final HolderRegistry INSTANCE=new HolderRegistry(); }
        public static HolderRegistry instance() { return Holder.INSTANCE; }
    }
    public static final class EventBus {
        private final List<Consumer<String>> listeners=new CopyOnWriteArrayList<>();
        public AutoCloseable subscribe(Consumer<String> listener) { listeners.add(listener);return () -> listeners.remove(listener); }
        public void publish(String event) { listeners.forEach(listener -> listener.accept(event)); }
    }
    @FunctionalInterface public interface ElevationStrategy { double elevation(List<SurveyPoint> points); }
    public double estimate(List<SurveyPoint> points,ElevationStrategy strategy) { return strategy.elevation(List.copyOf(points)); }
    public Optional<String> firstFailure(SurveyPoint point,List<Function<SurveyPoint,Optional<String>>> rules) {
        for(var rule:rules) { var result=rule.apply(point);if(result.isPresent()) return result; }
        return Optional.empty();
    }
    public abstract static class ImportTemplate {
        public final List<SurveyPoint> run(String input) { var points=parse(input);validate(points);return List.copyOf(points); }
        protected abstract List<SurveyPoint> parse(String input);
        protected void validate(List<SurveyPoint> points) { if(points.isEmpty()) throw new IllegalArgumentException("No points"); }
    }
    public record LegacyFeet(double x,double y,double z) {}
    public SurveyPoint adapt(String id,LegacyFeet point,int srid) {
        return new SurveyPoint(id,point.x()*0.3048,point.y()*0.3048,point.z()*0.3048,srid);
    }
}
