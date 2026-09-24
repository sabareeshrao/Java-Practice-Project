package com.aerotopo.service;
import io.github.resilience4j.circuitbreaker.*;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;

/** Caller-configured upstream; does not accept arbitrary URLs from API requests. */
public final class WeatherClient implements AutoCloseable {
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2))
            .followRedirects(HttpClient.Redirect.NEVER).build();
    private final URI endpoint;
    private final CircuitBreaker circuit;
    public WeatherClient(URI endpoint) {
        this.endpoint = endpoint;
        circuit = CircuitBreaker.of("flight-weather", CircuitBreakerConfig.custom()
                .slidingWindowSize(4).minimumNumberOfCalls(4).failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(10)).build());
    }
    public String forecast() throws Exception {
        return circuit.executeCallable(() -> {
            var request = HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(3)).GET().build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new java.io.IOException("Weather upstream returned " + response.statusCode());
            return response.body();
        });
    }
    public CircuitBreaker.State state() { return circuit.getState(); }
    @Override public void close() { client.close(); }
}
