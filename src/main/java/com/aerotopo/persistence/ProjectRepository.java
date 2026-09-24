package com.aerotopo.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface ProjectRepository extends JpaRepository<SurveyProject, UUID> {
    boolean existsByName(String name);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from SurveyProject p where p.id = :id")
    Optional<SurveyProject> findForUpdate(@Param("id") UUID id);
}
