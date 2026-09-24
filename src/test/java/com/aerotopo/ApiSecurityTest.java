package com.aerotopo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiSecurityTest {
    @Autowired MockMvc mvc;
    @Test void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/v1/projects").accept("application/json")).andExpect(status().isUnauthorized());
    }
    @Test void enforcesRoleAndCsrf() throws Exception {
        String body = "{\"name\":\"Secure survey\",\"srid\":32644}";
        mvc.perform(post("/api/v1/projects").with(user("processor").roles("PROCESSOR")).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/projects").with(user("manager").roles("MANAGER"))
                .contentType("application/json").content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/projects").with(user("manager").roles("MANAGER")).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isCreated()).andExpect(header().exists("Location"));
    }
    @Test void rejectsInvalidInputAndBoundsPageSize() throws Exception {
        mvc.perform(post("/api/v1/projects").with(user("manager").roles("MANAGER")).with(csrf())
                .contentType("application/json").content("{\"name\":\"\",\"srid\":4326}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/projects?size=100000").with(user("manager").roles("MANAGER"))).andExpect(status().isBadRequest());
    }
}
