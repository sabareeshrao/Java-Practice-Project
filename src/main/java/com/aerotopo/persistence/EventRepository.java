package com.aerotopo.persistence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface EventRepository extends JpaRepository<WorkflowEvent, UUID> {
    List<WorkflowEvent> findByProjectIdOrderByOccurredAtAsc(UUID projectId);
}
