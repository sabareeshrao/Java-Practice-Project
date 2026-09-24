package com.aerotopo.learning;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;
import java.util.function.*;

public final class ConcurrencyLab {
    public record TaskResult(String tile,int points) {}
    private final AtomicBoolean cancelled = new AtomicBoolean();
    private volatile boolean running = true;
    private final LongAdder completed = new LongAdder();
    private final ThreadLocal<String> currentTile = new ThreadLocal<>();

    public List<TaskResult> process(List<String> tileIds,ToIntFunction<String> processor,int permits) throws Exception {
        if(permits<1) throw new IllegalArgumentException();
        var gate = new Semaphore(permits);
        try(var executor=Executors.newVirtualThreadPerTaskExecutor()) {
            var futures = new ArrayList<Future<TaskResult>>();
            for(String tile:tileIds) {
                // Acquire before submission so submitted tasks are also bounded.
                gate.acquire();
                try {
                    futures.add(executor.submit(() -> {
                        currentTile.set(tile);
                        try {
                            if(cancelled.get()) throw new CancellationException("Survey cancelled");
                            var result = new TaskResult(tile,processor.applyAsInt(tile));
                            completed.increment();
                            return result;
                        } finally { currentTile.remove(); gate.release(); }
                    }));
                } catch(RuntimeException failure) { gate.release(); throw failure; }
            }
            var results = new ArrayList<TaskResult>();
            for(var future:futures) results.add(future.get(5,TimeUnit.SECONDS));
            return List.copyOf(results);
        }
    }
    public void cancel() { cancelled.set(true); running=false; }
    public long completed() { return completed.sum(); }
    public boolean running() { return running; }
    public CompletableFuture<Integer> combine(Executor executor,Supplier<Integer> terrain,Supplier<Integer> imagery) {
        var first=CompletableFuture.supplyAsync(terrain,executor);
        var second=CompletableFuture.supplyAsync(imagery,executor);
        return first.thenCombine(second,Integer::sum).orTimeout(2,TimeUnit.SECONDS);
    }
    public static final class BoundedBuffer<T> {
        private final int capacity;
        private final ArrayDeque<T> queue = new ArrayDeque<>();
        public BoundedBuffer(int capacity) { if(capacity<1) throw new IllegalArgumentException(); this.capacity=capacity; }
        public synchronized void put(T value) throws InterruptedException {
            while(queue.size()==capacity) wait();
            queue.add(Objects.requireNonNull(value));
            notifyAll();
        }
        public synchronized T take() throws InterruptedException {
            while(queue.isEmpty()) wait();
            T value=queue.remove(); notifyAll(); return value;
        }
    }
    public static final class LockedTile {
        private final ReentrantLock lock=new ReentrantLock();
        private final Condition changed=lock.newCondition();
        private int version;
        public boolean update(Duration timeout) throws InterruptedException {
            if(!lock.tryLock(timeout.toMillis(),TimeUnit.MILLISECONDS)) return false;
            try { version++; changed.signalAll(); return true; }
            finally { lock.unlock(); }
        }
        public int awaitAfter(int previous) throws InterruptedException {
            lock.lockInterruptibly();
            try { while(version<=previous) changed.await(); return version; }
            finally { lock.unlock(); }
        }
    }
    public static final class ElevationCache {
        private final ReadWriteLock lock=new ReentrantReadWriteLock();
        private final Map<String,Double> values=new HashMap<>();
        public void put(String key,double value) { lock.writeLock().lock(); try { values.put(key,value); } finally { lock.writeLock().unlock(); } }
        public Optional<Double> get(String key) { lock.readLock().lock(); try { return Optional.ofNullable(values.get(key)); } finally { lock.readLock().unlock(); } }
    }
    public static final class Position {
        private final StampedLock lock=new StampedLock();
        private double x,y;
        public void move(double x,double y) { long stamp=lock.writeLock(); try { this.x=x;this.y=y; } finally { lock.unlockWrite(stamp); } }
        public double[] read() {
            long stamp=lock.tryOptimisticRead();
            double localX=x,localY=y;
            if(!lock.validate(stamp)) {
                stamp=lock.readLock();
                try { localX=x;localY=y; } finally { lock.unlockRead(stamp); }
            }
            return new double[]{localX,localY};
        }
    }
    public static final class Sum extends RecursiveTask<Long> {
        private final int[] values; private final int from,to;
        public Sum(int[] values,int from,int to) { this.values=values;this.from=from;this.to=to; }
        @Override protected Long compute() {
            if(to-from<=64) { long total=0;for(int i=from;i<to;i++) total+=values[i]; return total; }
            int mid=(from+to)>>>1;
            var left=new Sum(values,from,mid);left.fork();
            long right=new Sum(values,mid,to).compute();
            return left.join()+right;
        }
    }
    public record DelayedTile(String id,long dueNanos) implements Delayed {
        public long getDelay(TimeUnit unit) { return unit.convert(dueNanos-System.nanoTime(),TimeUnit.NANOSECONDS); }
        public int compareTo(Delayed value) { return Long.compare(dueNanos,((DelayedTile)value).dueNanos); }
    }
    public int latchBatch(int count) throws Exception {
        CountDownLatch latch=new CountDownLatch(count);
        AtomicInteger results=new AtomicInteger();
        try(var executor=Executors.newFixedThreadPool(2)) {
            for(int i=0;i<count;i++) executor.submit(() -> { try { results.incrementAndGet(); } finally { latch.countDown(); } });
            if(!latch.await(2,TimeUnit.SECONDS)) throw new TimeoutException();
        }
        return results.get();
    }
    public List<Integer> completionOrder() throws Exception {
        try(var executor=Executors.newFixedThreadPool(2)) {
            CompletionService<Integer> completion=new ExecutorCompletionService<>(executor);
            completion.submit(() -> 10);completion.submit(() -> 20);
            return List.of(completion.take().get(),completion.take().get());
        }
    }
    public int exchange() throws Exception {
        Exchanger<Integer> exchanger=new Exchanger<>();
        try(var executor=Executors.newSingleThreadExecutor()) {
            var peer=executor.submit(() -> exchanger.exchange(10,2,TimeUnit.SECONDS));
            int result=exchanger.exchange(20,2,TimeUnit.SECONDS);
            return result+peer.get(2,TimeUnit.SECONDS);
        }
    }
    public int barrier() throws Exception {
        AtomicInteger phases=new AtomicInteger();
        CyclicBarrier barrier=new CyclicBarrier(2,phases::incrementAndGet);
        try(var executor=Executors.newSingleThreadExecutor()) {
            var peer=executor.submit(() -> { barrier.await(2,TimeUnit.SECONDS); return 1; });
            barrier.await(2,TimeUnit.SECONDS);peer.get(2,TimeUnit.SECONDS);
        }
        Phaser phaser=new Phaser(1);phaser.arriveAndAwaitAdvance();phaser.arriveAndDeregister();
        return phases.get();
    }
    public long accumulate(long[] values) {
        LongAccumulator max=new LongAccumulator(Long::max,Long.MIN_VALUE);
        for(long value:values) max.accumulate(value);
        return max.get();
    }
    public int scheduled() throws Exception {
        try(var timer=Executors.newSingleThreadScheduledExecutor()) {
            return timer.schedule(() -> 42,1,TimeUnit.MILLISECONDS).get(2,TimeUnit.SECONDS);
        }
    }
}
