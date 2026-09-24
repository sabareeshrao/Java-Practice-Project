"""Initial mapping authoring. Do not rerun over contributed mappings.
Defaults are RELATED, never a claim of complete implementation.
Curated ID overrides identify directly demonstrated concepts.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
J='src/main/java/com/aerotopo/'
T='src/test/java/com/aerotopo/'
questions=json.loads((ROOT/'interview/questions.json').read_text(encoding='utf-8'))['questions']
mappings={}
module_routes=[
    ('Development Environment','docs/TOOLCHAIN.md','# Toolchain','Procedure'),
    ('Programming & Java Ecosystem','docs/TOOLCHAIN.md','# Toolchain','Procedure'),
    ('JDK, JRE','docs/TOOLCHAIN.md','## JDK tools','Procedure'),
    ('Java Toolchain','docs/TOOLCHAIN.md','## JDK tools','Procedure'),
    ('Compilation, Bytecode',J+'AeroTopoApplication.java','public static void main','Related code'),
    ('Variables|Operators|Language Fundamentals|Methods, Parameters',J+'learning/LanguageLab.java','public final class LanguageLab','Related code'),
    ('Arrays|Algorithms',J+'learning/SurveyAlgorithms.java','public final class SurveyAlgorithms','Related code'),
    ('Strings',J+'learning/SurveyAlgorithms.java','public static String reverse','Related code'),
    ('Classes, Objects|Constructors|Access Modifiers|static, final|Inheritance|Polymorphism|Abstraction|Object Copying',J+'learning/SurveyProducts.java','public abstract static class Product','Related code'),
    ('Object Class|Wrapper Types',J+'domain/SurveyPoint.java','public record SurveyPoint','Related code'),
    ('Enums, Nested',J+'domain/SurveyStatus.java','public enum SurveyStatus','Related code'),
    ('Exception Handling',J+'api/ApiErrors.java','public class ApiErrors','Related code'),
    ('ConcurrentHashMap',J+'learning/CollectionLab.java','public static final class TileCounters','Related code'),
    ('Collections|List &|LinkedList|Set,|Map &|Sorted Maps|Queue,|Iterator,',J+'learning/CollectionLab.java','public final class CollectionLab','Related code'),
    ('Generics',J+'learning/GenericPipeline.java','public final class GenericPipeline','Related code'),
    ('Functional Programming|Streams',J+'learning/StreamExercises.java','public final class StreamExercises','Related code'),
    ('Optional',J+'gis/TerrainEngine.java','public Optional<SurveyPoint> highest','Related code'),
    ('Date, Time|Standard Java API',J+'learning/UtilityLab.java','public final class UtilityLab','Related code'),
    ('Java Versions|Modern Java','docs/TOOLCHAIN.md','## Language version caveats','Related code'),
    ('I/O, Files|Core Java I/O',J+'learning/IoLab.java','public final class IoLab','Related code'),
    ('Serialization',J+'learning/IoLab.java','public byte[] serialize','Related code'),
    ('Class Loading',J+'learning/RuntimeLab.java','public final class RuntimeLab','Related code'),
    ('JVM Memory|Garbage Collection|Memory Management','docs/RUNBOOK.md','## Profiling','Related code'),
    ('Thread Basics|Synchronization|volatile,|Executors|CompletableFuture|Deadlock|Advanced & Virtual',J+'learning/ConcurrencyLab.java','public final class ConcurrencyLab','Related code'),
    ('SOLID',J+'service/DeliveryTransport.java','public interface DeliveryTransport','Related code'),
    ('Design Patterns',J+'learning/PatternLab.java','public final class PatternLab','Related code'),
    ('JUnit|Mockito',T+'FrameworkLabTest.java','class FrameworkLabTest','Related code'),
    ('Maven & Gradle','pom.xml','<project xmlns','Related code'),
    ('Git, Bitbucket','docs/RUNBOOK.md','## Git and review','Procedure'),
    ('Code Quality','CONTRIBUTING.md','## Evidence standards','Procedure'),
    ('Logging',J+'ops/RequestTraceFilter.java','public class RequestTraceFilter','Related code'),
    ('SQL & Relational','src/main/resources/db/migration/V1__survey_schema.sql','create table survey_project','Related code'),
    ('Database Transactions',J+'service/ProjectService.java','public SurveyProject ingest','Related code'),
    ('JDBC',J+'learning/JdbcLab.java','public final class JdbcLab','Related code'),
    ('Spring Framework|Spring Components|Spring Beans',J+'learning/SpringLifecycleLab.java','public class SpringLifecycleLab','Related code'),
    ('Spring AOP',J+'ops/ServiceMetrics.java','public Object timed','Related code'),
    ('Spring Transaction',J+'service/ProjectService.java','public SurveyProject ingest','Related code'),
    ('Spring Async',J+'service/AsyncQualityService.java','public CompletableFuture','Related code'),
    ('Spring Caching',J+'service/ProjectService.java','@Cacheable','Related code'),
    ('Spring Configuration',J+'config/SurveyProperties.java','@ConfigurationProperties','Related code'),
    ('Spring Boot Fundamentals',J+'AeroTopoApplication.java','@SpringBootApplication','Related code'),
    ('Spring Boot Auto','src/main/resources/application.yml','spring:','Related code'),
    ('Embedded Server','src/main/resources/application.yml','server:','Related code'),
    ('Spring Batch|Spring Integration','docs/ARCHITECTURE.md','## Scaling decisions','Missing'),
    ('Servlets',J+'ops/RequestTraceFilter.java','protected void doFilterInternal','Related code'),
    ('REST, HTTP|API Validation|JSON, Jackson',J+'api/ProjectController.java','public class ProjectController','Related code'),
    ('Swagger','docs/API.md','# HTTP API','Procedure'),
    ('REST Clients',J+'service/WeatherClient.java','public String forecast','Related code'),
    ('WebFlux','docs/ARCHITECTURE.md','## AI and integration boundaries','Missing'),
    ('JPA & Hibernate',J+'persistence/SurveyProject.java','public class SurveyProject','Related code'),
    ('Spring Data JPA',J+'persistence/ProjectRepository.java','public interface ProjectRepository','Related code'),
    ('ORM Queries',J+'persistence/PointRepository.java','public Map<String, Object> summary','Related code'),
    ('Spring Security|JWT,|Encryption',J+'config/SecurityConfig.java','public class SecurityConfig','Related code'),
    ('Messaging, Kafka',J+'service/KafkaDeliveryTransport.java','public class KafkaDeliveryTransport','Related code'),
    ('Microservices Fundamentals',J+'service/DeliveryOutbox.java','public void onDelivery','Related code'),
    ('Service Discovery|Feign &','docs/ARCHITECTURE.md','## AI and integration boundaries','Missing'),
    ('Resilience',J+'service/WeatherClient.java','public WeatherClient','Related code'),
    ('Saga,','docs/ARCHITECTURE.md','## Transactions and consistency','Missing'),
    ('Distributed Caching','docs/ARCHITECTURE.md','## Transactions and consistency','Missing'),
    ('Observability',J+'ops/ServiceMetrics.java','public Object timed','Related code'),
    ('Notifications,','docs/ARCHITECTURE.md','## Transactions and consistency','Missing'),
    ('CI/CD','.github/workflows/verify.yml','name: Verify','Procedure'),
    ('Docker','Dockerfile','FROM maven','Procedure'),
    ('Kubernetes','deploy/kubernetes.yml','kind: Deployment','Procedure'),
    ('Linux, Cloud','docs/RUNBOOK.md','## Deployment and rollback','Procedure'),
    ('Performance,','docs/RUNBOOK.md','## Slow queries','Related code'),
    ('Production Debugging','docs/RUNBOOK.md','## Profiling','Procedure'),
    ('Availability,','docs/RUNBOOK.md','## Database unavailable','Procedure'),
    ('System Design','docs/ARCHITECTURE.md','## Scaling decisions','Procedure'),
    ('Javax /','docs/TOOLCHAIN.md','## Migration','Procedure'),
    ('AI, LLM','docs/ARCHITECTURE.md','## AI and integration boundaries','Missing'),
    ('Project Architecture','PROJECT_CONTEXT.md','## What we are building','Procedure'),
    ('Team Collaboration|Behavioral,','docs/RUNBOOK.md','## Leadership and behavioral practice','Procedure'),
    ('Networking & HTTP',J+'learning/NetworkLab.java','public final class NetworkLab','Related code'),
    ('Java Platform Module','labs/jpms/src/com.aerotopo.spi/module-info.java','module com.aerotopo.spi','Related code'),
    ('Native & Foreign','labs/foreign-jdk22/ForeignElevation.java','public class ForeignElevation','Version lab')
]
import re
for q in questions:
    route=next((r for r in module_routes if re.search(r[0],q['module'])),None)
    if not route: raise ValueError('Unrouted module: '+q['module'])
    _,file,anchor,kind=route
    level=int(q['level'][1:])
    year=1 if level<=3 else 2 if level<=7 else 3 if level<=10 else 4 if level<=12 else 5
    mappings[str(q['id'])]={'year':year,'kind':kind,'evidence':[{'file':file,'anchor':anchor}],
        'note':('Starting point for this topic. The linked code does not fully demonstrate every detail asked; add a focused example or test.'
                if kind=='Related code' else 'Not implemented. This link documents the relevant boundary and contribution opportunity.'
                if kind=='Missing' else 'Requires the stated JDK; excluded from the Java 21 build and not locally executed.'
                if kind=='Version lab' else 'Project procedure or configuration to study and apply; not a claim of personal employment experience.')}

def direct(ids,file,anchor,note,test=None,kind='Direct code'):
    if isinstance(ids,int): ids=[ids]
    for id in ids:
        mappings[str(id)].update(kind=kind,evidence=[{'file':file,'anchor':anchor}],note=note)
        if test: mappings[str(id)]['evidence'].append({'file':T+test,'anchor':'class '+test.removesuffix('.java')})

def code(ids,file,anchor,note,test='LearningLabTest.java'):
    direct(ids,J+file,anchor,note,test)

code([17,20,22],'AeroTopoApplication.java','public static void main','The application launcher exposes the Java 21 public static void main(String[] args) entry point.',None)
code([23,25,2043,2044,2045,2046,2047],'learning/LanguageLab.java','public static List<Integer> numericConversions','Trace narrowing to int/byte, widening to long, and Integer text conversion.')
code([32,2060,2061,2062],'learning/LanguageLab.java','public static void reassign','Compare reassign and mutate: Java copies the reference value; changing the referenced list is observable.')
code([37,42],'learning/SurveyAlgorithms.java','public static int deduplicateSorted','Compare unique (new array) with deduplicateSorted (in-place prefix).')
code(38,'learning/SurveyAlgorithms.java','public static int[] mergeSorted','Concatenate two int streams, sort, and materialize.')
code(39,'learning/SurveyAlgorithms.java','public static void binaryFlags','Validate binary flags, count zeros, and fill both partitions.')
code(40,'learning/SurveyAlgorithms.java','public static void moveZerosRight','Stable nonzero compaction followed by zero fill.')
code([45,46,48,55],'learning/SurveyAlgorithms.java','public static String reverse','StringBuilder owns a mutable local buffer; reverse returns a String.')
code(50,'learning/SurveyAlgorithms.java','public static Map<String,List<String>> anagrams','Sort each label to a character signature and group matching labels.')
code(51,'learning/SurveyAlgorithms.java','public static int indexOf','Explicit character comparison with an outer loop; no built-in substring search.')
code([52,754],'learning/SurveyAlgorithms.java','public static OptionalInt firstUniqueCodePoint','Count Unicode code points in encounter order and select the first count of one.')
code(53,'learning/SurveyAlgorithms.java','public static String expandRuns','Decode counts with checked arithmetic and an output-size bound.')
code(54,'learning/SurveyAlgorithms.java','public static String longestPalindrome','Expand around odd and even centers.')
code([58,60,61,66,68,70,71,72,73,74,75,76,84,90,91,98,99,100,101,115,116,118,120,121,122,123,125,126,128,129,130,133,134,135,138,155,166],'learning/SurveyProducts.java','public abstract static class Product','Study Product, Orthomosaic, Dem, Builder, and Units for explicit construction, encapsulation, composition and dispatch.')
code([139,141,143],'learning/LanguageLab.java','public static String join','int and Integer overloads show compile-time method selection.')
code([94,103,107,117],'learning/LanguageLab.java','static { batches','Static initialization and class-level batch state contrast with per-instance accepted counts.')
code([2009,2010,2011,2012,2013],'learning/LanguageLab.java','public static int switchFallThrough','Compare the if/else ladder in classify with the traditional int switch and intentional fall-through.')
code([2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025],'learning/LanguageLab.java','public static int scanGrid','Loop experiments include for/while, enhanced for, continue, break, labeled break and do-while; inspect each method.')
code([2029,2030,2031],'learning/LanguageLab.java','public static boolean shortCircuit','Compare null-safe && with eager & and a BooleanSupplier.')
code([2035,2036,2037,2040],'learning/LanguageLab.java','public static Map<String, Object> operators','Bit shifts, XOR, masks, ternary selection, postfix and prefix increments.')
code(2042,'learning/LanguageLab.java','public static int sum','Math.addExact rejects overflowing totals; the test checks the boundary.')
code([2054,2056,2057,2059],'learning/LanguageLab.java','public static int sum','int... is an array inside sum; compare join overload signatures.')
code([2063,747,757],'learning/SurveyAlgorithms.java','public static long factorial','The bounded factorial has a base case and checked multiplication.')
for id in [77,79,87,88,97,127,142,144,751,752,2055,2058,2087,2095,2264]:
    direct(id,T+'CompilerRulesTest.java','@ValueSource','The JavaCompiler test compiles illegal declarations under --release 21 and requires a diagnostic. Match the exact declaration in the source.')
code([2072,2073],'domain/SurveyStatus.java','public enum SurveyStatus','Workflow states define behavior with a switch expression; status transitions are exercised by SurveyWorkflowTest.','SurveyWorkflowTest.java')
code([2074,2075,2096],'learning/GenericPipeline.java','public static final class TileMapper','A String mapper implements Mapper<String>; reflection test observes the compiler-generated bridge method.')
code([2076,2077,2085,2088,2089,2090],'learning/GenericPipeline.java','public static <N extends Number> double total','Numeric and recursive/intersection bounds constrain reusable algorithms.')
code([2078,2079,2080,2081,2082,2083,2084,2086,2094],'learning/GenericPipeline.java','public final class GenericPipeline','Constructor/map/copyInto apply producer extends and consumer super; merge uses safe generic varargs.')
code([2099,2100,2101,2103,2107,2108,2118,2119],'io/PointCsv.java','public List<SurveyPoint> read','InputStreamReader decodes UTF-8; buffered character parsing closes resources.','TerrainEngineTest.java')
code([2102,2105],'learning/IoLab.java','public void bufferedCopy','Buffered byte streams transfer bytes and are closed with try-with-resources.')
code(2106,'learning/IoLab.java','public String fileReader','FileReader decodes explicit UTF-8 and transfers characters to a StringWriter.')
code([2109,2110,2111],'learning/IoLab.java','public IOException suppressed','Tests show reverse close order and suppressed close failures while the processing failure stays primary.')
code([2112,2113,2116,2117],'io/PointCsv.java','public void write','NIO Path/Files create a temporary file and replace the target atomically when supported.','TerrainEngineTest.java')
code(2115,'learning/IoLab.java','public long lines','Files.lines streams content and is closed; readAllLines would materialize the full file.')
code([2120,2121,2122,2124],'learning/IoLab.java','public double binaryElevation','ByteBuffer transitions from writing to reading with flip/clear; FileChannel persists a little-endian double.')
code(2125,'learning/NetworkLab.java','public int selectorReadiness','A nonblocking server channel registers OP_ACCEPT and waits with a bounded selector call.')
code(2126,'learning/IoLab.java','public WatchService watch','Registers entry creation notifications; ownership of the returned WatchService belongs to the caller.')
code(2127,'learning/IoLab.java','public byte mappedFirstByte','Reads the first byte through a read-only file mapping.')
code(2128,'learning/IoLab.java','public byte[] serialize','Object serialization has an object protocol, unlike raw binary/text IO. Deserialization uses a bounded filter.')
for a,b,anchor in [(2129,2133,'public long insert'),(2134,2134,'public int absoluteWithCallable'),
                   (2135,2139,'public List<String> above'),(2140,2143,'public void batch'),
                   (2144,2144,'public long insert'),(2145,2146,'public Map<String,Object> metadata'),
                   (2147,2149,'public void batch')]:
    code(range(a,b+1),'learning/JdbcLab.java',anchor,'Run FrameworkLabTest to observe prepared statements, resource ownership, metadata and transaction behavior.','FrameworkLabTest.java')
code([2154,2156,2157,2159],'learning/UtilityLab.java','public BigDecimal quote','Survey pricing uses decimal multiplication and explicit HALF_UP rounding to two places.')
code(2160,'learning/UtilityLab.java','public BigInteger possibleMasks','BigInteger computes large layer-mask counts without fixed-width integer overflow.')
code([2161,2163],'learning/UtilityLab.java','public Optional<TileId> parse','Pattern/Matcher require a full match and extract named capturing groups.')
code(2165,'learning/UtilityLab.java','public List<String> scannerRows','Consume the newline after nextInt before reading whole lines.')
code([2167,2168],'learning/UtilityLab.java','public String localizedArea','Locale-aware String.format controls display formatting.')
code([2169,2170],'learning/UtilityLab.java','public String message','ResourceBundle resolves English/French survey messages.')
code([2171,2172,2173,2174,2175,2176],'learning/UtilityLab.java','public String localCapture','Instant storage, ZonedDateTime formatting, Duration and Period separate timeline and calendar concepts.')
code([2177,2178],'gis/TerrainEngine.java','public Optional<SurveyPoint> highest','Optional expresses no eligible highest point without a sentinel/null.','TerrainEngineTest.java')
for ids,anchor in [([2179,2180,2208,736],'public List<TaskResult> process'),
                  ([2181],'public int latchBatch'),([2182,2183],'public int barrier'),
                  ([2184,2185,2186,2187],'public static final class LockedTile'),
                  ([2188,2189],'public static final class ElevationCache'),
                  ([2190,2191],'public static final class Position'),
                  ([2196],'public record DelayedTile'),([2198,2199,2200],'public static final class Sum'),
                  ([2201,2202],'public List<Integer> completionOrder'),
                  ([2203],'public int scheduled'),([2205],'private final LongAdder completed'),
                  ([2206],'public long accumulate')]:
    code(ids,'learning/ConcurrencyLab.java',anchor,'Concrete concurrency experiment with survey tasks. Compare API guarantees and failure paths; tests use bounded waits.')
for ids,anchor in [([2209,2210,2211,2223],'public String tcpEcho'),([2212,2213],'public String udpLoopback'),
                  ([2215,2216],'public String legacyGet'),([2217,2218,2219,2220,2221,2222],'public String postJson')]:
    code(ids,'learning/NetworkLab.java',anchor,'Concrete networking code with resource cleanup and timeouts. TCP/UDP/selector loopback tests run locally; HTTP helper usage requires an endpoint.')
for ids,anchor in [([2279,2280,2281,2282],'public HeightSource proxy'),([2283,2284],'public double methodHandle'),
                  ([2285,2286],'public boolean compareAndSet'),([2287],'public List<String> services'),
                  ([2288],'public List<String> signatures'),([2291],'public Class<?> load'),
                  ([2293],'public List<String> callers'),([2294,2295,2296,2297,2298],'public ReferenceSet references'),
                  ([2299],'public Map<Object,String> weakMetadata'),([2301,2302],'public static final class NativeBuffer')]:
    code(ids,'learning/RuntimeLab.java',anchor,'Runtime experiment; inspect the paired tests. Cleaner experiment counts cleanup calls and does not bind native memory.')
for id in range(2239,2254):
    direct(id,'labs/jpms/src/com.aerotopo.spi/module-info.java','module com.aerotopo.spi',
           'Run labs/jpms/run.ps1 and inspect all three descriptors. This is a named-module SPI example.',
           kind='Related code')
for id in [2241,2242,2243,2246,2247]:
    direct(id,'labs/jpms/src/com.aerotopo.spi/module-info.java','module com.aerotopo.spi','Named module descriptor has exports, requires transitive and requires static directives.')
for id in [2244,2245,2252]:
    direct(id,'labs/jpms/src/com.aerotopo.provider/module-info.java','opens com.aerotopo.provider','Provider package is opened to the named consumer, while its public contract is exported separately.')
direct(2253,'labs/jpms/src/com.aerotopo.app/com/aerotopo/app/Main.java','var names=ServiceLoader','ServiceLoader discovers the provider registered in module-info.java.')
code([2256,2258,2259,2260,2270,2271],'learning/LanguageLab.java','public static String format','Java 21 pattern switch includes null, type patterns and a guard; Product result uses record deconstruction.')
code([2261,2262,2263],'domain/SurveyPoint.java','public record SurveyPoint','Record components define state and generated value methods; compact constructor enforces invariants.','TerrainEngineTest.java')
code([2265,2266,2267],'learning/SurveyProducts.java','public sealed interface Result','Sealed Result permits Success and Failure and enables exhaustive record-pattern dispatch.')
for id in [2272,2274,2275]:
    direct(id,'labs/modern-jdk25/ModernSurvey.java','import module java.base','Actual JDK 25 source; excluded from Java 21 build and not executed locally.',kind='Version lab')
direct(2273,'labs/modern-jdk25/CompactSurvey.java','void main','Compact source file with instance main, requiring JDK 25.',kind='Version lab')
for id in [2306,2307,2308]:
    direct(id,'labs/foreign-jdk22/ForeignElevation.java','try(Arena arena','Arena and MemorySegment store native-memory heights and enforce lifetime. Requires JDK 22+; not locally executed.',kind='Version lab')
code([753],'learning/StreamExercises.java','public int[] xorSwap','XOR swaps two independent integer variables without a third temporary value.')
code([756],'learning/SurveyAlgorithms.java','public static boolean prime','Trial divisors stop at the square root using division to avoid overflow.')
code([758],'learning/StreamExercises.java','public long fibonacci','Iterative Fibonacci handles the supported long range.')
stream_ids={761:'characterCounts',762:'upper',763:'upper',764:'secondHighestRate',765:'ratesAbove',766:'sum',767:'sum',768:'titleCase',769:'nthHighest',771:'onlyUnique',772:'duplicates',773:'sum',774:'oddSum',775:'oddSquares',777:'startingWithOne',778:'highest',779:'streamFactorial',780:'highest',781:'byLength',782:'numericCharacters',783:'numericCharacters',784:'joined',785:'nthLongest',786:'primeSum',787:'mostFrequent',788:'sum',789:'palindrome',790:'firstRepeating',791:'palindromes',792:'frequentWords',793:'evenSum',794:'doubleEvens',795:'highest',796:'digitSum',797:'averageRate',798:'nthLongest',799:'duplicates',464:'flatten',465:'flatten',473:'partitionEven'}
for id,method in stream_ids.items():
    text=(ROOT/J/'learning/StreamExercises.java').read_text()
    anchor=next(line.strip() for line in text.splitlines() if 'public ' in line and ' '+method+'(' in line)
    code(id,'learning/StreamExercises.java',anchor,'Concrete stream operation on survey IDs, labels or surveyor rates. Inspect method parameters for rank/limit semantics.')
for ids,file,anchor,note in [
    ([819],'learning/PatternLab.java','public SurveyPoint adapt','Legacy feet measurements adapt to metre-based SurveyPoint values.'),
    ([820,849,852],'learning/PatternLab.java','public static final class DoubleCheckedRegistry','Volatile publication and an inner synchronized double-check protect lazy initialization.'),
    ([821,837],'learning/PatternLab.java','public static final class HolderRegistry','Class initialization safely publishes a lazy holder singleton.'),
    ([822,823,824,828,857],'learning/SurveyProducts.java','public static final class Builder','Builder accumulates configuration and creates an immutable orthomosaic descriptor.'),
    ([832],'learning/PatternLab.java','public abstract static class ImportTemplate','Final template method controls parse, validate and immutable result creation.'),
    ([834],'learning/PatternLab.java','public static final class EventBus','Observer subscriptions return an AutoCloseable unsubscriber.'),
    ([838,847,854,856],'learning/SurveyProducts.java','public enum ProductFactory','Enum singleton factory is initialized by the JVM.'),
    ([853],'learning/PatternLab.java','public Optional<String> firstFailure','Validation chain stops at the first failed point rule.'),
    ([861,862],'learning/PatternLab.java','public double estimate','Strategy injection changes elevation calculation; same dispatch pattern can model payment methods.')]:
    code(ids,file,anchor,note)
code([1733],'service/DeliveryOutbox.java','public void onDelivery','DeliveryRequested inserts an outbox record inside the same transaction.','SurveyWorkflowTest.java')
code([1760],'service/LocalDeliveryTransport.java','public void send','Event ID is the receipt primary key; outbox row locking serializes local publishing.','SurveyWorkflowTest.java')
target=ROOT/'interview/mappings.json'
if target.exists(): raise SystemExit('Refusing to overwrite mappings.json; edit existing mappings instead.')
target.write_text(json.dumps(mappings,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Seeded',len(mappings),'mappings. Related links remain explicitly partial.')
