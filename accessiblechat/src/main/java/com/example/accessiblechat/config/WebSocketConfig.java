package com.example.accessiblechat.config;

import java.util.Collections;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  @Override
  public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
    System.out.println("Registering STOMP endpoints...");
    // Clients will connect to ws://localhost:9090/ws
    registry.addEndpoint("/ws")
        .setAllowedOriginPatterns("*")
        .withSockJS();
  }

  @Override
  public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
    System.out.println("Configuring message broker...");
    // Prefix for messages FROM server to client:
    config.enableSimpleBroker("/queue");
    // Prefix for messages FROM client to server:
    config.setApplicationDestinationPrefixes("/app");
    // Prefix for user-specific destinations:
    config.setUserDestinationPrefix("/user");
  }

  @Override
  public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
    // Intercept the CONNECT frame to bind the STOMP header "username" as the
    // session Principal
    System.out.println("Configuring client inbound channel...");
    registration.interceptors(new ChannelInterceptor() {
      @Override
      public @NonNull Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        System.out.println("Adding channel interceptor for CONNECT frame...");
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getCommand() != null
            && accessor.getCommand().name().equals("CONNECT")) {
          String username = accessor.getFirstNativeHeader("username");
          System.out.println("CONNECT received, username = " + username);
          accessor.setUser(
              new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList()));

        }

        return message;
      }
    });
  }
}
