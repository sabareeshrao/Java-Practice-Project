package com.aerotopo.service;

import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;
import java.time.*;
import java.util.UUID;

@Component
public class DeliveryOutbox {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public DeliveryOutbox(JdbcTemplate jdbc, Clock clock) { this.jdbc = jdbc; this.clock = clock; }
    // Synchronous listener joins the delivery transaction: either both records commit or neither does.
    @EventListener
    @Transactional(propagation = Propagation.MANDATORY)
    public void onDelivery(ProjectService.DeliveryRequested event) {
        jdbc.update("insert into delivery_outbox(event_id,project_id,payload,created_at) values(?,?,?,?)",
                UUID.randomUUID(), event.projectId(), "Survey delivered: " + event.projectName(), OffsetDateTime.now(clock));
    }
}
