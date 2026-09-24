package com.aerotopo.gis;

import com.aerotopo.domain.*;
import org.locationtech.jts.geom.*;
import org.locationtech.jts.index.strtree.STRtree;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Component
public class TerrainEngine {
    /** Independent checkpoints must not be the same observations used to create the surface. */
    public double verticalRmse(List<Double> surveyed, List<Double> reference) {
        if (surveyed.isEmpty() || surveyed.size() != reference.size())
            throw new IllegalArgumentException("Provide equal nonempty checkpoint arrays");
        double sum = 0;
        for (int i = 0; i < surveyed.size(); i++) {
            double residual = surveyed.get(i) - reference.get(i);
            if (!Double.isFinite(residual)) throw new IllegalArgumentException("Invalid checkpoint");
            sum += residual * residual;
        }
        return Math.sqrt(sum / surveyed.size());
    }

    public QualityReport validate(List<SurveyPoint> points, int expectedSrid,
                                  List<Double> surveyed, List<Double> reference, double tolerance) {
        if (!Double.isFinite(tolerance) || tolerance <= 0) throw new IllegalArgumentException("Invalid tolerance");
        var issues = new ArrayList<String>();
        var ids = new HashSet<String>();
        int duplicates = 0;
        for (SurveyPoint point : points) {
            if (!ids.add(point.id())) duplicates++;
            if (point.srid() != expectedSrid) issues.add("CRS mismatch: " + point.id());
        }
        if (points.size() < 3) issues.add("At least three ground points required");
        if (duplicates > 0) issues.add("Duplicate point IDs: " + duplicates);
        double rmse = verticalRmse(surveyed, reference);
        if (rmse > tolerance) issues.add("Vertical RMSE exceeds " + tolerance + " m");
        var elevations = points.stream().mapToDouble(SurveyPoint::z).summaryStatistics();
        return new QualityReport(points.size(), duplicates,
                points.isEmpty() ? 0 : elevations.getMin(), points.isEmpty() ? 0 : elevations.getMax(), rmse, issues);
    }

    public Polygon footprint(List<SurveyPoint> ring) {
        if (ring.size() < 3) throw new IllegalArgumentException("At least three vertices required");
        var first = ring.getFirst();
        ring.forEach(first::requireSameCrs);
        var coordinates = new ArrayList<Coordinate>();
        ring.forEach(p -> coordinates.add(new Coordinate(p.x(), p.y())));
        if (!coordinates.getFirst().equals2D(coordinates.getLast())) coordinates.add(new Coordinate(coordinates.getFirst()));
        var polygon = new GeometryFactory(new PrecisionModel(), first.srid())
                .createPolygon(coordinates.toArray(Coordinate[]::new));
        if (!polygon.isValid() || polygon.getArea() == 0) throw new IllegalArgumentException("Invalid survey boundary");
        return polygon;
    }

    public double areaHectares(List<SurveyPoint> ring) { return footprint(ring).getArea() / 10_000; }

    /** Inverse-distance interpolation in projected metres. This is not photogrammetric reconstruction. */
    public double elevationAt(SurveyPoint query, List<SurveyPoint> groundPoints) {
        if (groundPoints.isEmpty()) throw new IllegalArgumentException("No ground points");
        double weights = 0, weightedHeight = 0;
        for (var point : groundPoints) {
            double distance = query.distanceTo(point);
            if (distance < 1e-9) return point.z();
            double weight = 1 / (distance * distance);
            weights += weight;
            weightedHeight += weight * point.z();
        }
        return weightedHeight / weights;
    }

    public List<SurveyPoint> within(List<SurveyPoint> points, Polygon boundary) {
        var index = new STRtree();
        for (var point : points) {
            if (point.srid() != boundary.getSRID()) throw new IllegalArgumentException("Mixed coordinate systems");
            index.insert(new Envelope(point.x(), point.x(), point.y(), point.y()), point);
        }
        index.build();
        var candidates = index.query(boundary.getEnvelopeInternal());
        var result = new ArrayList<SurveyPoint>();
        for (Object candidate : candidates) {
            SurveyPoint point = (SurveyPoint) candidate;
            if (boundary.covers(boundary.getFactory().createPoint(new Coordinate(point.x(), point.y())))) result.add(point);
        }
        return List.copyOf(result);
    }

    public Map<Integer, List<SurveyPoint>> elevationBands(List<SurveyPoint> points, int width) {
        if (width <= 0) throw new IllegalArgumentException("Positive band width required");
        return points.stream().collect(Collectors.groupingBy(p -> (int)Math.floor(p.z() / width), TreeMap::new, Collectors.toList()));
    }

    public Optional<SurveyPoint> highest(List<SurveyPoint> points, Predicate<SurveyPoint> eligible) {
        return points.stream().filter(eligible).max(Comparator.comparingDouble(SurveyPoint::z));
    }
}
