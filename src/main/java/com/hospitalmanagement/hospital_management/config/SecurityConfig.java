package com.hospitalmanagement.hospital_management.config;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import com.hospitalmanagement.hospital_management.service.CustomUserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JWTAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)throws Exception{
        http
                .csrf(csrf->csrf.disable())
                .sessionManagement(session->session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth->auth
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/signup.html",
                                "/dashboard.html",
                                "/patients.html",
                                "/doctors.html",
                                "/departments.html",
                                "/appointments.html",
                                "/insurance.html",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/partials/**",
                                "/favicon.ico",
                                "/auth/**"
                        ).permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/report").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/Doctor", "/Doctor/**", "/doctor", "/doctor/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/Doctor", "/Doctor/**", "/doctor", "/doctor/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/Doctor", "/Doctor/**", "/doctor", "/doctor/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/Department", "/Department/**", "/department", "/department/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/Department", "/Department/**", "/department", "/department/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/Department", "/Department/**", "/department", "/department/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/Insurance", "/Insurance/**", "/insurance", "/insurance/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/Insurance", "/Insurance/**", "/insurance", "/insurance/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/Insurance", "/Insurance/**", "/insurance", "/insurance/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/Patient", "/patient").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/Appointment", "/appointment").hasRole("ADMIN")
                        .requestMatchers("/Doctor/**", "/Doctor", "/doctor/**", "/doctor").hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                        .requestMatchers("/Patient/**", "/Patient", "/patient/**", "/patient").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .requestMatchers("/Department/**", "/Department", "/department/**", "/department").hasAnyRole("DOCTOR", "ADMIN", "PATIENT")
                        .requestMatchers("/Insurance/**", "/Insurance", "/insurance/**", "/insurance").hasAnyRole("PATIENT", "ADMIN", "DOCTOR")
                        .requestMatchers("/Appointment/**", "/Appointment", "/appointment/**", "/appointment").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =new DaoAuthenticationProvider(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();

    }
}
