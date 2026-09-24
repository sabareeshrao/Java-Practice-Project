package com.aerotopo.service;
import java.util.UUID;
@FunctionalInterface
public interface DeliveryTransport {
    void send(UUID eventId, String payload) throws Exception;
}
