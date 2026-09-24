package com.aerotopo;
import com.aerotopo.domain.*;
import com.aerotopo.gis.*;
import com.aerotopo.io.PointCsv;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class TerrainEngineTest {
    final TerrainEngine engine = new TerrainEngine();
    @Test void geometryAndInterpolationHaveIndependentExpectedValues() {
        var ring = List.of(new SurveyPoint("a",0,0,10,32644),new SurveyPoint("b",100,0,20,32644),
                new SurveyPoint("c",100,100,20,32644),new SurveyPoint("d",0,100,10,32644));
        assertThat(engine.areaHectares(ring)).isEqualTo(1.0);
        assertThat(engine.elevationAt(new SurveyPoint("q",50,50,0,32644),ring)).isEqualTo(15.0);
        assertThat(engine.verticalRmse(List.of(2.0,4.0),List.of(1.0,3.0))).isEqualTo(1.0);
        assertThat(engine.within(ring,engine.footprint(ring))).hasSize(4);
    }
    @Test void rejectsMixedCrsInvalidNumbersAndCrossingBoundary() {
        assertThatThrownBy(() -> new SurveyPoint("a",Double.NaN,0,0,32644)).isInstanceOf(IllegalArgumentException.class);
        var a = new SurveyPoint("a",0,0,0,32644);
        assertThatThrownBy(() -> a.distanceTo(new SurveyPoint("b",0,0,0,32643))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> engine.footprint(List.of(a,new SurveyPoint("b",1,1,0,32644),
                new SurveyPoint("c",0,1,0,32644),new SurveyPoint("d",1,0,0,32644)))).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void csvRoundTripAndStrictErrors(@TempDir Path dir) throws Exception {
        var codec = new PointCsv();
        var path = dir.resolve("points.csv");
        codec.write(path,SurveyWorkflowTest.points());
        assertThat(codec.read(Files.newInputStream(path),10)).isEqualTo(SurveyWorkflowTest.points());
        assertThatThrownBy(() -> codec.read(Files.newInputStream(path),2)).isInstanceOf(java.io.IOException.class);
    }
    @Test void flightGeometry() {
        var planner = new FlightPlanner();
        assertThat(planner.groundSampleDistance(120,new FlightPlanner.Camera(36,24,6000))).isEqualTo(0.03);
        assertThat(planner.strips(500,180,0.6)).hasSize(6);
        assertThatThrownBy(() -> planner.strips(500,180,1)).isInstanceOf(IllegalArgumentException.class);
    }
}
