package com.example.smartparking.auth;

import java.util.Set;

/**
 * Authentication response DTO returned after successful login or registration.
 */
public class AuthResponse {

    private String id;
    private String name;
    private String email;
    private Set<String> roles;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String id, String name, String email, Set<String> roles, String message) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.roles = roles;
        this.message = message;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
