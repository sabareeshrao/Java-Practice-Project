package com.aerotopo.config;

import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import java.security.SecureRandom;
import java.util.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean
    @Profile("!jwt")
    UserDetailsService users(PasswordEncoder encoder, Environment environment) {
        var users = new ArrayList<UserDetails>();
        for (String role : List.of("MANAGER", "PROCESSOR", "REVIEWER")) {
            String password = environment.getProperty("SURVEY_" + role + "_PASSWORD");
            if (password == null || password.isBlank()) {
                byte[] random = new byte[24];
                new SecureRandom().nextBytes(random);
                password = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
                LoggerFactory.getLogger(SecurityConfig.class).warn("Local {} password: {}", role.toLowerCase(Locale.ROOT), password);
            }
            users.add(User.withUsername(role.toLowerCase(Locale.ROOT)).password(encoder.encode(password)).roles(role).build());
        }
        return new InMemoryUserDetailsManager(users);
    }
    @Bean
    @Profile("!jwt")
    SecurityFilterChain localSecurity(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(a -> a
                        .requestMatchers("/actuator/health", "/error").permitAll()
                        .requestMatchers("/actuator/**").hasRole("MANAGER")
                        .anyRequest().authenticated())
                .formLogin(Customizer.withDefaults())
                .httpBasic(Customizer.withDefaults())
                // CSRF remains enabled for session and browser Basic authentication.
                .build();
    }
    @Bean
    @Profile("jwt")
    SecurityFilterChain jwtSecurity(HttpSecurity http) throws Exception {
        var converter = new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter();
        var authorities = new org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return http.authorizeHttpRequests(a -> a.requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/**").hasRole("MANAGER").anyRequest().authenticated())
                .sessionManagement(s -> s.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.disable())
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(converter))).build();
    }
}
