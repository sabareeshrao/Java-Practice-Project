package com.aerotopo;
import com.aerotopo.domain.*;
import com.aerotopo.learning.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;

class LearningLabTest {
    @Test void languageSemantics() {
        var ids=new ArrayList<String>(List.of("A"));
        LanguageLab.reassign(ids);assertThat(ids).containsExactly("A");
        LanguageLab.mutate(ids);assertThat(ids).containsExactly("A","GCP");
        assertThat(LanguageLab.switchFallThrough(3)).isEqualTo(111);
        assertThat(LanguageLab.sum(3,4,5)).isEqualTo(12);
        assertThat(LanguageLab.numericConversions(258.9)).containsExactly(258,2,258,258);
        assertThat(LanguageLab.format(-1)).isEqualTo("invalid");
        assertThatThrownBy(() -> LanguageLab.sum(Integer.MAX_VALUE,1)).isInstanceOf(ArithmeticException.class);
        assertThat(LanguageLab.shortCircuit(null)).isFalse();
    }
    @Test void objectsCollectionsAndGenerics() {
        var source=new ArrayList<>(List.of("T1"));
        var product=new SurveyProducts.Orthomosaic("ORTHO",source,0.05);
        source.add("T2");assertThat(product.tiles()).containsExactly("T1");
        assertThat(product).isEqualTo(new SurveyProducts.Orthomosaic("ORTHO",List.of(),0.1));
        assertThat(new SurveyProducts.Units().units()).isEqualTo("m");
        var lru=new CollectionLab.Lru<String,Integer>(2);
        lru.put("a",1);lru.put("b",2);lru.get("a");lru.put("c",3);
        assertThat(lru.keySet()).containsExactly("a","c");
        var map=new CollectionLab.ChainedMap<String,Integer>(1);
        map.put("a",1);map.put("b",2);map.put("a",3);assertThat(map.get("a")).contains(3);
        var target=new ArrayList<Number>();new GenericPipeline<>(List.of(1,2)).map(n -> n*2).copyInto(target);
        assertThat(target).containsExactly(2,4);
        assertThat(Arrays.stream(GenericPipeline.TileMapper.class.getDeclaredMethods()).anyMatch(java.lang.reflect.Method::isBridge)).isTrue();
    }
    @Test void algorithmResultsAndEdges() {
        int[] values={0,2,0,1};SurveyAlgorithms.moveZerosRight(values);assertThat(values).containsExactly(2,1,0,0);
        assertThat(SurveyAlgorithms.indexOf("ORTHO-103","103")).isEqualTo(6);
        assertThat(SurveyAlgorithms.indexOf("abc","")).isZero();
        assertThat(SurveyAlgorithms.expandRuns("3a2b",10)).isEqualTo("aaabb");
        assertThatThrownBy(() -> SurveyAlgorithms.expandRuns("999a",10)).isInstanceOf(IllegalArgumentException.class);
        assertThat(SurveyAlgorithms.longestPalindrome("abac")).isEqualTo("aba");
        assertThat(SurveyAlgorithms.factorial(6)).isEqualTo(720);
        assertThat(SurveyAlgorithms.prime(1)).isFalse();
        assertThat(SurveyAlgorithms.prime(97)).isTrue();
        assertThat(SurveyAlgorithms.firstUniqueCodePoint("aabbc")).hasValue('c');
    }
    @Test void streamExerciseExpectedResults() {
        var lab=new StreamExercises();
        var ids=List.of(1,2,3,2,4,3);
        assertThat(lab.onlyUnique(ids)).containsExactly(1,4);
        assertThat(lab.duplicates(ids)).containsExactly(2,3);
        assertThat(lab.nthHighest(ids,3)).contains(2);
        assertThat(lab.oddSquares(ids)).isEqualTo(19);
        assertThat(lab.mostFrequent(ids,2)).containsExactly(2,3);
        assertThat(lab.secondHighestRate(List.of(new StreamExercises.Surveyor("A",100),new StreamExercises.Surveyor("B",90)))).contains("B");
        assertThat(lab.fibonacci(10)).isEqualTo(55);
        assertThat(lab.streamFactorial(6)).isEqualTo(720);
        assertThat(lab.palindrome("radar")).isTrue();
        assertThat(lab.digitSum(-123)).isEqualTo(6);
        assertThat(lab.xorSwap(4,9)).containsExactly(9,4);
    }
    @Test void concurrencyCompletesAndPublishesResults() throws Exception {
        var lab=new ConcurrencyLab();
        assertThat(lab.process(List.of("A","BB","CCC"),String::length,2)).extracting(ConcurrencyLab.TaskResult::points).containsExactly(1,2,3);
        assertThat(lab.completed()).isEqualTo(3);
        assertThat(lab.latchBatch(10)).isEqualTo(10);
        assertThat(lab.exchange()).isEqualTo(30);
        assertThat(lab.barrier()).isEqualTo(1);
        assertThat(lab.completionOrder()).containsExactlyInAnyOrder(10,20);
        assertThat(lab.scheduled()).isEqualTo(42);
        var buffer=new ConcurrencyLab.BoundedBuffer<Integer>(1);
        try(var executor=Executors.newSingleThreadExecutor()) {
            var value=executor.submit(buffer::take);buffer.put(7);assertThat(value.get(2,TimeUnit.SECONDS)).isEqualTo(7);
        }
        var position=new ConcurrencyLab.Position();position.move(4,6);assertThat(position.read()).containsExactly(4,6);
        assertThat(ForkJoinPool.commonPool().invoke(new ConcurrencyLab.Sum(new int[]{1,2,3},0,3))).isEqualTo(6);
    }
    @Test void ioAndRuntime(@TempDir Path temp) throws Throwable {
        var io=new IoLab();var point=new SurveyPoint("P",1,2,3,32644);
        assertThat(io.deserialize(io.serialize(point))).isEqualTo(point);
        assertThat(io.binaryElevation(temp.resolve("point.bin"),12.25)).isEqualTo(12.25);
        var closed=new ArrayList<String>();var failure=io.suppressed(closed);
        assertThat(failure.getSuppressed()).hasSize(2);assertThat(closed).containsExactly("second","first");
        var runtime=new RuntimeLab();var calls=new AtomicInteger();
        var proxy=runtime.proxy(id -> 42,calls);
        assertThat(proxy.height("T")).isEqualTo(42);assertThat(calls.get()).isEqualTo(1);
        assertThat(runtime.methodHandle(proxy,"T")).isEqualTo(42);
        assertThat(runtime.compareAndSet(0,1)).isTrue();
        var releases=new AtomicInteger();
        try(var resource=new RuntimeLab.NativeBuffer(releases)) { resource.close(); }
        assertThat(releases.get()).isEqualTo(1);
        assertThat(runtime.references(point).phantom().get()).isNull();
    }
    @Test void localNetworking() throws Exception {
        var network=new NetworkLab();
        assertThat(network.tcpEcho("tile-1")).isEqualTo("tile-1");
        assertThat(network.udpLoopback("survey")).isEqualTo("survey");
        assertThat(network.selectorReadiness()).isEqualTo(1);
    }
}
