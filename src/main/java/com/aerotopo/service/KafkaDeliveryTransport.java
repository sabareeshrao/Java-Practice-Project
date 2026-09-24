package com.aerotopo.service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@ConditionalOnProperty(name="survey.transport",havingValue="kafka")
public class KafkaDeliveryTransport implements DeliveryTransport {
    private final KafkaTemplate<String, String> kafka;
    public KafkaDeliveryTransport(KafkaTemplate<String, String> kafka) { this.kafka = kafka; }
    @Override public void send(UUID eventId, String payload) throws Exception {
        // Broker acknowledgement before marking the outbox row. A crash can cause a duplicate.
        kafka.send("survey.delivery", eventId.toString(), payload).get(5, TimeUnit.SECONDS);
    }
}
