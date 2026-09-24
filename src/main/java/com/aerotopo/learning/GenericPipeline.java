package com.aerotopo.learning;
import java.io.Serializable;
import java.util.*;
import java.util.function.*;

public final class GenericPipeline<T> {
    private final List<T> items;
    public GenericPipeline(Collection<? extends T> items) { this.items=List.copyOf(items); }
    public <R> GenericPipeline<R> map(Function<? super T,? extends R> mapper) {
        List<R> mapped=new ArrayList<>();
        for(T item:items) mapped.add(mapper.apply(item));
        return new GenericPipeline<>(mapped);
    }
    public GenericPipeline<T> filter(Predicate<? super T> predicate) { return new GenericPipeline<>(items.stream().filter(predicate).toList()); }
    public void copyInto(Collection<? super T> destination) { destination.addAll(items); }
    public List<T> values() { return items; }
    public static <N extends Number> double total(Collection<N> values) { return values.stream().mapToDouble(Number::doubleValue).sum(); }
    public static <S extends Comparable<? super S> & Serializable> S maximum(List<S> values) { return Collections.max(values); }
    @SafeVarargs public static <T> List<T> merge(List<? extends T>... sources) {
        var target=new ArrayList<T>();
        for(var source:sources) target.addAll(source);
        return List.copyOf(target);
    }
    public static int unknownSize(List<?> values) { return values.size(); }
    public interface Mapper<T> { T map(T value); }
    public static final class TileMapper implements Mapper<String> {
        @Override public String map(String value) { return value.strip().toUpperCase(Locale.ROOT); }
    }
}
