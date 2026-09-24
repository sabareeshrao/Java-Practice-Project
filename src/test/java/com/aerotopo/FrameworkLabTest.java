package com.aerotopo;
import com.aerotopo.learning.*;
import com.aerotopo.service.*;
import com.aerotopo.persistence.*;
import com.aerotopo.config.SurveyProperties;
import com.aerotopo.gis.TerrainEngine;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.context.ApplicationEventPublisher;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class FrameworkLabTest {
    @Test void beanScopesQualifiersAndLifecycle() {
        SpringLifecycleLab.Lifecycle lifecycle;
        try(var context=new AnnotationConfigApplicationContext()) {
            context.getEnvironment().setActiveProfiles("learning");
            context.register(SpringLifecycleLab.class);context.refresh();
            lifecycle=context.getBean(SpringLifecycleLab.Lifecycle.class);
            assertThat(lifecycle.datum()).isEqualTo("Everest");
            assertThat(lifecycle.newSession().id).isNotEqualTo(lifecycle.newSession().id);
            assertThat(lifecycle.events()).containsExactly("constructor","context","postConstruct","afterPropertiesSet");
        }
        assertThat(lifecycle.events()).endsWith("preDestroy","destroy");
    }
    @Test void jdbcTransactionsRollbackWholeBatch() throws Exception {
        var source=new DriverManagerDataSource("jdbc:h2:mem:jdbc-lab;DB_CLOSE_DELAY=-1","sa","");
        var jdbc=new JdbcLab(source);jdbc.initialize();
        assertThat(jdbc.insert("A",10)).isPositive();
        var batch=new LinkedHashMap<String,Double>();batch.put("B",20.0);batch.put("A",30.0);
        assertThatThrownBy(() -> jdbc.batch(batch)).isInstanceOf(java.sql.SQLException.class);
        assertThat(jdbc.above(0)).containsExactly("A");
        assertThat(jdbc.metadata()).containsEntry("columns",3);
        assertThat(jdbc.absoluteWithCallable(-10)).isEqualTo(10);
    }
    @Test void duplicateProjectDoesNotSaveOrEmitEvents() {
        var repository=mock(ProjectRepository.class);
        var events=mock(EventRepository.class);
        when(repository.existsByName("Survey")).thenReturn(true);
        var service=new ProjectService(repository,mock(PointRepository.class),events,new TerrainEngine(),
                new SurveyProperties(100,0.15,32644),mock(ApplicationEventPublisher.class));
        assertThatThrownBy(() -> service.create("Survey",32644,"manager")).isInstanceOf(com.aerotopo.domain.SurveyException.class);
        verify(repository,never()).save(any());verifyNoInteractions(events);
    }
}
