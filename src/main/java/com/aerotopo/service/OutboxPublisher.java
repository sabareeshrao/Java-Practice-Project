package com.aerotopo.service;
import org.slf4j.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Component
public class OutboxPublisher {
    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);
    private final JdbcTemplate jdbc;
    private final DeliveryTransport transport;
    public OutboxPublisher(JdbcTemplate jdbc, DeliveryTransport transport) { this.jdbc = jdbc; this.transport = transport; }
    @Scheduled(fixedDelayString="${survey.outbox-delay-ms:5000}")
    @Transactional
    public void publish() {
        // Row locks coordinate multiple application instances; batch is bounded.
        var rows = jdbc.queryForList("select event_id,payload from delivery_outbox where published=false order by created_at limit 25 for update");
        for (var row : rows) {
            UUID id = (UUID)row.get("event_id");
            try {
                transport.send(id, (String)row.get("payload"));
                jdbc.update("update delivery_outbox set published=true where event_id=?", id);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception failure) {
                log.warn("Outbox event {} retained for retry: {}", id, failure.getClass().getSimpleName());
                break;
            }
        }
    }
}
