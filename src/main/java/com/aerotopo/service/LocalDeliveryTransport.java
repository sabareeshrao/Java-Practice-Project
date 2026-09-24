package com.aerotopo.service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.time.OffsetDateTime;
import java.util.UUID;

@Component
@ConditionalOnProperty(name="survey.transport",havingValue="local",matchIfMissing=true)
public class LocalDeliveryTransport implements DeliveryTransport {
    private final JdbcTemplate jdbc;
    public LocalDeliveryTransport(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public void send(UUID eventId, String payload) {
        if (jdbc.queryForObject("select count(*) from delivery_receipt where event_id=?", Integer.class, eventId) == 0)
            jdbc.update("insert into delivery_receipt(event_id,payload,received_at) values(?,?,?)", eventId, payload, OffsetDateTime.now());
    }
}
