package com.aerotopo.learning;

import java.lang.annotation.*;
import java.lang.invoke.*;
import java.lang.ref.*;
import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

public final class RuntimeLab {
    @Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
    public @interface Measured { String unit() default "m"; }
    public interface HeightSource { @Measured double height(String tile); }
    public HeightSource proxy(HeightSource target,AtomicInteger calls) {
        return (HeightSource)Proxy.newProxyInstance(HeightSource.class.getClassLoader(),new Class<?>[]{HeightSource.class},
                (proxy,method,args) -> {
                    try { calls.incrementAndGet();return method.invoke(target,args); }
                    catch(InvocationTargetException failure) { throw failure.getCause(); }
                });
    }
    public double methodHandle(HeightSource source,String id) throws Throwable {
        MethodHandle handle=MethodHandles.lookup().findVirtual(HeightSource.class,"height",MethodType.methodType(double.class,String.class));
        return (double)handle.invokeExact(source,id);
    }
    private volatile int version;
    public boolean compareAndSet(int expected,int update) throws ReflectiveOperationException {
        VarHandle handle=MethodHandles.lookup().findVarHandle(RuntimeLab.class,"version",int.class);
        return handle.compareAndSet(this,expected,update);
    }
    public List<String> callers() { return StackWalker.getInstance().walk(s -> s.limit(8).map(StackWalker.StackFrame::getMethodName).toList()); }
    public List<String> services(Class<?> type) { return ServiceLoader.load(type).stream().map(p -> p.type().getName()).toList(); }
    public List<String> signatures(Class<?> type) { return Arrays.stream(type.getDeclaredMethods()).map(Method::toGenericString).sorted().toList(); }
    public List<String> publicMembers(Class<?> type) { return Arrays.stream(type.getMethods()).map(Method::getName).distinct().sorted().toList(); }
    public record ReferenceSet(WeakReference<Object> weak,SoftReference<Object> soft,PhantomReference<Object> phantom,ReferenceQueue<Object> queue) {}
    public ReferenceSet references(Object point) {
        ReferenceQueue<Object> queue=new ReferenceQueue<>();
        return new ReferenceSet(new WeakReference<>(point,queue),new SoftReference<>(point),new PhantomReference<>(point,queue),queue);
    }
    public Map<Object,String> weakMetadata() { return new WeakHashMap<>(); }
    public static final class NativeBuffer implements AutoCloseable {
        private static final Cleaner CLEANER=Cleaner.create();
        private static final class State implements Runnable {
            private final AtomicInteger releases;
            State(AtomicInteger releases) { this.releases=releases; }
            @Override public void run() { releases.incrementAndGet(); }
        }
        private final Cleaner.Cleanable cleanable;
        public NativeBuffer(AtomicInteger releases) { cleanable=CLEANER.register(this,new State(releases)); }
        @Override public void close() { cleanable.clean(); }
    }
    public Class<?> load(String name,boolean initialize) throws ClassNotFoundException {
        return Class.forName(name,initialize,getClass().getClassLoader());
    }
}
