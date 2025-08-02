package com.example.accessiblechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

@Document(collection = "users")
public class User {

  @Id
  private String id;
  private String username;
  private String email;
  private String password;
  @JsonProperty("isBlind")
  private boolean isBlind;

  // Getters & Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username.toLowerCase(); // for case-insensitive match
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email.toLowerCase();
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public boolean isBlind() {
    return isBlind;
  }

  @JsonProperty("isBlind")
  public void setIsBlind(boolean isblind) {
    this.isBlind = isblind;
  }
}
