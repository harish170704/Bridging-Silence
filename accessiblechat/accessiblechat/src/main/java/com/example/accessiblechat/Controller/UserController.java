package com.example.accessiblechat.Controller;

import com.example.accessiblechat.model.User;
import com.example.accessiblechat.Service.UserService;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*") // allow frontend access
public class UserController {

  @Autowired
  private UserService userService;

  private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

  @PostMapping("/signup")
  public String registerUser(@RequestBody Map<String, Object> payload) {
    // 1) Log out exactly what Jackson saw:
    // System.out.println("🔍 RAW JSON payload: " + payload);

    // 2) Convert it into your User type:
    User user = objectMapper.convertValue(payload, User.class);

    // 3) Then proceed as before:
    return userService.registerUser(user);
  }

  @GetMapping("/exists/{username}")
  public String userExists(@PathVariable String username) {
    return userService.userExists(username) ? "true" : "false";
  }

  @PostMapping("/login")
  public String loginUser(@RequestBody User user) {
    return userService.loginUser(user.getUsername(), user.getPassword());
  }
}
