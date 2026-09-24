# Optional toolchain laboratories

The main Maven application and its tests use JDK 21. Sources in this directory are excluded from that build.

## JPMS (JDK 21)

Run ./labs/jpms/run.ps1 on Windows. On Linux:

```sh
mkdir -p target/jpms
javac --module-source-path labs/jpms/src -d target/jpms $(find labs/jpms/src -name '*.java')
java --module-path target/jpms --module com.aerotopo.app/com.aerotopo.app.Main
```

The provider is discovered using uses/provides. Its package is opened only to the application, not exported. The SPI module exports its public contract and declares transitive and compile-time-only dependencies. Do not place the same package in two named modules.

## Modern language syntax (JDK 25)

```sh
java labs/modern-jdk25/ModernSurvey.java
java labs/modern-jdk25/CompactSurvey.java
```

These illustrate module imports, flexible constructor bodies, unnamed variables, compact source files and instance main. They require JDK 25. They are not validated by a JDK 21 Maven run.

## Foreign memory (JDK 22+)

```sh
java labs/foreign-jdk22/ForeignElevation.java
```

The FFM API became final in JDK 22. This lab uses memory allocation and lifetime checks, not a native GIS library binding. JNI bindings and primitive-pattern preview examples remain contribution opportunities.

String templates were previewed in JDK 21/22 and withdrawn; do not add them as ordinary modern production syntax. Preview features require a matching JDK and --enable-preview at compile and runtime. See [Oracle language changes](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-summary.html) and [FFM API](https://docs.oracle.com/en/java/javase/22/core/foreign-function-and-memory-api.html).
