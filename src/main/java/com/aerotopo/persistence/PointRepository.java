package com.aerotopo.persistence;

import com.aerotopo.domain.SurveyPoint;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class PointRepository {
    private final JdbcTemplate jdbc;
    public PointRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public void replace(UUID projectId, List<SurveyPoint> points) {
        jdbc.update("delete from survey_point where project_id = ?", projectId);
        jdbc.batchUpdate("""
                insert into survey_point(project_id, point_id, x, y, z, srid)
                values (?, ?, ?, ?, ?, ?)
                """, points, 500, (statement, point) -> {
            statement.setObject(1, projectId);
            statement.setString(2, point.id());
            statement.setDouble(3, point.x());
            statement.setDouble(4, point.y());
            statement.setDouble(5, point.z());
            statement.setInt(6, point.srid());
        });
    }
    public List<SurveyPoint> find(UUID projectId) {
        return jdbc.query("select point_id,x,y,z,srid from survey_point where project_id=? order by point_id",
                (rs, row) -> new SurveyPoint(rs.getString(1), rs.getDouble(2), rs.getDouble(3), rs.getDouble(4), rs.getInt(5)), projectId);
    }
    public Map<String, Object> summary(UUID projectId) {
        return jdbc.queryForMap("""
                select count(*) as point_count, min(z) as min_elevation, max(z) as max_elevation,
                       avg(z) as mean_elevation from survey_point where project_id=?
                """, projectId);
    }
}
