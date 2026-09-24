# Toolchain and compatibility

The main project uses JDK 21 and Maven. Import pom.xml into IntelliJ IDEA, Eclipse, or STS. Set the project SDK and Maven runner JDK consistently. Lombok is not required: the project uses explicit code and records.

In IntelliJ use Navigate to Class (Ctrl+N), Find in Files (Ctrl+Shift+F), Go to Declaration (Ctrl+B), and Find Usages (Alt+F7), subject to your active keymap. Equivalent STS/Eclipse commands include Open Type, Open Resource, and Organize Imports.

## JDK tools

After compilation, run these from the repository:

```text
javap -classpath target/classes -c com.aerotopo.domain.SurveyStatus
jdeps --ignore-missing-deps target/classes
jar --list --file target/aerotopo-1.0.0.jar
javadoc -d target/javadoc src/main/java/com/aerotopo/domain/SurveyPoint.java
jshell --class-path target/classes
```

javac produces bytecode; java launches the JVM. JRE runtime components execute code; the JDK also includes compiler and diagnostics. Multiple installed JDKs are selected through PATH, JAVA_HOME, IDE configuration, or toolchains. Classpath and named module path are different; see labs/jpms.

The Spring Boot Maven plugin packages an executable JAR with a Boot launcher manifest, application classes and dependencies. It differs from a plain java -cp invocation. jlink creates a custom runtime for a resolved module graph; jpackage builds installers around an application and runtime. These require platform-specific packaging verification.

## Language version caveats

CompilerRulesTest uses --release 21. Its constructor rules describe Java 21. Java 25 permits a restricted prologue before super()/this(), so older interview wording claiming that super() must always be the very first statement needs version context.

ModernSurvey and CompactSurvey require JDK 25. ForeignElevation requires JDK 22+. Preview features require a matching compiler/runtime release with --enable-preview. String templates were withdrawn; do not assume every preview became permanent.

See [Oracle Java 25 language changes](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-summary.html) and [Spring Boot 3.5 requirements](https://docs.spring.io/spring-boot/3.5/system-requirements.html).

## Migration

Application imports use jakarta.persistence, jakarta.validation, and jakarta.servlet. JDBC DataSource remains javax.sql; it was not renamed to jakarta.sql. A javax→jakarta migration requires dependency and server compatibility checks, not a global text replacement.
