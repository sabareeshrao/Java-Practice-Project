package com.aerotopo.learning;

import com.aerotopo.domain.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Function;
import java.util.stream.*;

public final class CollectionLab {
    public Map<String,SurveyPoint> deduplicate(List<SurveyPoint> points) {
        Map<String,SurveyPoint> result = new LinkedHashMap<>();
        points.forEach(point -> result.putIfAbsent(point.id(),point));
        return Collections.unmodifiableMap(result);
    }
    public List<SurveyPoint> sorted(List<SurveyPoint> points) {
        var copy = new ArrayList<>(points);
        copy.sort(Comparator.comparingDouble(SurveyPoint::z).thenComparing(SurveyPoint::id));
        return List.copyOf(copy);
    }
    public Set<SurveyPoint> uniqueNatural(List<SurveyPoint> points) { return new TreeSet<>(points); }
    public Set<SurveyPoint> uniqueValue(List<SurveyPoint> points) { return new HashSet<>(points); }
    public Map<SurveyStatus,Long> statusCounts(List<SurveyStatus> states) {
        return states.stream().collect(Collectors.groupingBy(Function.identity(), () -> new EnumMap<>(SurveyStatus.class), Collectors.counting()));
    }
    public List<String> reviewQueue(List<String> urgent, List<String> normal) {
        Deque<String> queue = new ArrayDeque<>(normal);
        for (int i=urgent.size()-1;i>=0;i--) queue.addFirst(urgent.get(i));
        var result = new LinkedList<String>();
        while(!queue.isEmpty()) result.add(queue.removeFirst());
        return result;
    }
    public List<SurveyPoint> lowestFirst(List<SurveyPoint> points) {
        var queue = new PriorityQueue<>(Comparator.comparingDouble(SurveyPoint::z));
        queue.addAll(points);
        var result = new ArrayList<SurveyPoint>();
        while(!queue.isEmpty()) result.add(queue.remove());
        return result;
    }
    public void removeRejected(List<SurveyPoint> points,Set<String> rejected) {
        for(Iterator<SurveyPoint> it=points.iterator();it.hasNext();) if(rejected.contains(it.next().id())) it.remove();
    }
    public static final class Lru<K,V> extends LinkedHashMap<K,V> {
        private final int capacity;
        public Lru(int capacity) {
            super(16,0.75f,true);
            if(capacity<1) throw new IllegalArgumentException("Invalid capacity");
            this.capacity=capacity;
        }
        @Override protected boolean removeEldestEntry(Map.Entry<K,V> eldest) { return size()>capacity; }
    }
    public static final class TileCounters {
        private final ConcurrentHashMap<String,java.util.concurrent.atomic.LongAdder> counts=new ConcurrentHashMap<>();
        public void observe(String tile) { counts.computeIfAbsent(tile,key -> new java.util.concurrent.atomic.LongAdder()).increment(); }
        public long count(String tile) { var value=counts.get(tile); return value==null ? 0 : value.sum(); }
        public Map<String,Long> snapshot() { return counts.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey,e -> e.getValue().sum())); }
    }
    public static final class ChainedMap<K,V> {
        private record Entry<K,V>(K key,V value) {}
        private final List<List<Entry<K,V>>> buckets;
        public ChainedMap(int capacity) {
            if(capacity<1) throw new IllegalArgumentException();
            buckets=new ArrayList<>(capacity);
            for(int i=0;i<capacity;i++) buckets.add(new ArrayList<>());
        }
        private List<Entry<K,V>> bucket(K key) { return buckets.get(Math.floorMod(Objects.hashCode(key),buckets.size())); }
        public void put(K key,V value) {
            var bucket=bucket(key);
            for(int i=0;i<bucket.size();i++) if(Objects.equals(bucket.get(i).key(),key)) { bucket.set(i,new Entry<>(key,value)); return; }
            bucket.add(new Entry<>(key,value));
        }
        public Optional<V> get(K key) { return bucket(key).stream().filter(e -> Objects.equals(e.key(),key)).findFirst().map(Entry::value); }
    }
    public NavigableMap<Double,SurveyPoint> elevationIndex(List<SurveyPoint> points) {
        var result = new TreeMap<Double,SurveyPoint>();
        points.forEach(p -> result.put(p.z(),p));
        return result;
    }
}
