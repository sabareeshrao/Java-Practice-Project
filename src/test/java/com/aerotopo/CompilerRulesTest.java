package com.aerotopo;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import javax.tools.*;
import static org.assertj.core.api.Assertions.*;

class CompilerRulesTest {
    @ParameterizedTest
    @ValueSource(strings={
        "final abstract class Invalid {}",
        "class Invalid { static Invalid() {} }",
        "class Invalid { final Invalid() {} }",
        "class Invalid { private protected void run() {} }",
        "private class Invalid {}",
        "class Invalid { int run(){return 1;} String run(){return \"x\";} }",
        "class Invalid { static void run(){ break; } }",
        "class Invalid { void run(){ for(;1;){} } }",
        "class Invalid { void run(int... x,int y){} }",
        "class Invalid<T> { static T value; }",
        "class Invalid<T> { T[] points=new T[2]; }",
        "class Invalid extends Invalid {}",
        "record Invalid(int id) { int other; }"
    })
    void compilerRejectsIllegalDeclarations(String source,@TempDir Path dir) throws Exception {
        Path file=dir.resolve("Invalid.java");Files.writeString(file,source);
        var compiler=ToolProvider.getSystemJavaCompiler();
        var diagnostics=new DiagnosticCollector<JavaFileObject>();
        try(var manager=compiler.getStandardFileManager(diagnostics,null,null)) {
            boolean compiled=compiler.getTask(null,manager,diagnostics,
                    java.util.List.of("-d",dir.toString(),"--release","21"),null,manager.getJavaFileObjects(file)).call();
            assertThat(compiled).isFalse();
            assertThat(diagnostics.getDiagnostics()).anyMatch(d -> d.getKind()==Diagnostic.Kind.ERROR);
        }
    }
}
