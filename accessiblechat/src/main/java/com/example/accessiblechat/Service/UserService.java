package com.example.accessiblechat.Service;

import com.example.accessiblechat.model.User;
import com.example.accessiblechat.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

  @Autowired
  private UserRepository userRepository;

  public String registerUser(User user) {
    boolean usernameExists = userRepository.findByUsername(user.getUsername()).isPresent();
    boolean emailExists = userRepository.findByEmail(user.getEmail()).isPresent();

    if (usernameExists || emailExists) {
      return "Username or Email already exists";
    }

    userRepository.save(user);
    return "User registered successfully";
  }

  public String loginUser(String username, String password) {
    Optional<User> userOpt = userRepository.findByUsername(username);
    if (userOpt.isPresent()) {
      String stored = userOpt.get().getPassword().trim();
      String input = password.trim();

      // System.out.println("🔍 Username: " + username);
      // System.out.println("🔍 Stored Password: " + stored);
      // System.out.println("🔍 Input Password: " + input);

      if (stored.equals(input)) {
        return "Login successful";
      }
    } else {
      return " incorrect password or email";
    }

    return "Invalid username or password";
  }

  public boolean userExists(String username) {
    return userRepository.findByUsername(username).isPresent();
  }

}
