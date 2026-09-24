package com.aerotopo.io;

import com.aerotopo.domain.SurveyPoint;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import org.springframework.stereotype.Component;

/** Deliberately strict five-column interchange: id,x,y,z,srid. No quoted fields. */
@Component
public class PointCsv {
    public List<SurveyPoint> read(InputStream input, int limit) throws IOException {
        if (limit < 1) throw new IllegalArgumentException("Invalid limit");
        try (var reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            if (!"id,x,y,z,srid".equals(reader.readLine())) throw new IOException("Expected header id,x,y,z,srid");
            var points = new ArrayList<SurveyPoint>();
            String line;
            int row = 1;
            while ((line = reader.readLine()) != null) {
                row++;
                if (points.size() >= limit) throw new IOException("Point limit exceeded");
                String[] fields = line.split(",", -1);
                if (fields.length != 5) throw new IOException("Expected 5 columns at row " + row);
                try {
                    points.add(new SurveyPoint(fields[0].strip(), Double.parseDouble(fields[1]),
                            Double.parseDouble(fields[2]), Double.parseDouble(fields[3]), Integer.parseInt(fields[4])));
                } catch (IllegalArgumentException e) { throw new IOException("Invalid point at row " + row, e); }
            }
            return List.copyOf(points);
        }
    }

    public void write(Path target, List<SurveyPoint> points) throws IOException {
        Path parent = target.toAbsolutePath().getParent();
        Files.createDirectories(parent);
        Path temporary = Files.createTempFile(parent, "survey-", ".csv");
        try {
            try (var writer = Files.newBufferedWriter(temporary, StandardCharsets.UTF_8)) {
                writer.write("id,x,y,z,srid\n");
                for (var p : points) {
                    if (p.id().matches(".*[,\r\n].*")) throw new IOException("Point id cannot contain delimiters");
                    writer.write(String.format(Locale.ROOT, "%s,%.6f,%.6f,%.6f,%d%n", p.id(), p.x(), p.y(), p.z(), p.srid()));
                }
            }
            try { Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING); }
            catch (AtomicMoveNotSupportedException e) { Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING); }
        } finally { Files.deleteIfExists(temporary); }
    }
}
