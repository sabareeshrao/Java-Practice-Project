package com.aerotopo;

import com.aerotopo.config.SurveyProperties;
import com.aerotopo.domain.*;
import com.aerotopo.gis.TerrainEngine;
import com.aerotopo.persistence.*;
import com.aerotopo.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class SurveyWorkflowTest {
    @Autowired ProjectService service;
    @Autowired OutboxPublisher publisher;
    @Autowired JdbcTemplate jdbc;
    static List<SurveyPoint> points() {
        return List.of(new SurveyPoint("A",0,0,10,32644),new SurveyPoint("B",100,0,10.1,32644),new SurveyPoint("C",100,100,10.2,32644));
    }
    @Test void completeWorkflowAndIdempotentDelivery() {
        var project = service.create("Survey " + UUID.randomUUID(),32644,"manager");
        UUID originalId = project.getId();
        assertThatThrownBy(() -> service.deliver(originalId,0,"manager")).isInstanceOf(SurveyException.class);
        project = service.ingest(project.getId(),points(),0,"processor");
        var quality = service.process(project.getId(),project.getVersion(),List.of(10.01,10.11),List.of(10.0,10.1),"processor");
        assertThat(quality.passed()).isTrue();
        project = service.get(project.getId());
        project = service.approve(project.getId(),project.getVersion(),"reviewer");
        project = service.deliver(project.getId(),project.getVersion(),"manager");
        service.deliver(project.getId(),0,"manager");
        assertThat(service.history(project.getId())).extracting(WorkflowEvent::getAction)
                .containsExactly("CREATED","INGESTED","VALIDATED","APPROVED","DELIVERED");
        assertThat(jdbc.queryForObject("select count(*) from delivery_outbox where project_id=?",Integer.class,project.getId())).isEqualTo(1);
        publisher.publish();
        assertThat(jdbc.queryForObject("select count(*) from delivery_outbox where project_id=? and published=true",Integer.class,project.getId())).isEqualTo(1);
    }
    @Test void invalidIngestRollsBackAndStaleVersionIsRejected() {
        var project = service.create("Rollback " + UUID.randomUUID(),32644,"manager");
        UUID id = project.getId();
        var bad = List.of(points().getFirst(),points().getFirst(),points().getLast());
        assertThatThrownBy(() -> service.ingest(id,bad,0,"processor")).isInstanceOf(IllegalArgumentException.class);
        assertThat(service.points(id)).isEmpty();
        assertThat(service.get(id).getStatus()).isEqualTo(SurveyStatus.PLANNED);
        service.ingest(id,points(),0,"processor");
        assertThatThrownBy(() -> service.ingest(id,points(),0,"processor")).isInstanceOf(SurveyException.class);
    }
    @Test void failedQualityCannotBeApproved() {
        var project = service.create("Bad QA " + UUID.randomUUID(),32644,"manager");
        project = service.ingest(project.getId(),points(),0,"processor");
        service.process(project.getId(),project.getVersion(),List.of(12.0),List.of(10.0),"processor");
        var failed = service.get(project.getId());
        assertThat(failed.getStatus()).isEqualTo(SurveyStatus.FAILED);
        assertThatThrownBy(() -> service.approve(failed.getId(),failed.getVersion(),"reviewer")).isInstanceOf(SurveyException.class);
    }
}
