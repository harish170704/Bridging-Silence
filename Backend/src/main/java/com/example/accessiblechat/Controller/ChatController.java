package com.example.accessiblechat.Controller;

import com.example.accessiblechat.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

  private final SimpMessagingTemplate messagingTemplate;

  public ChatController(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  @MessageMapping("/chat.send")
  public void sendMessage(@Payload ChatMessage message) {
    // Send message to recipient's topic
    messagingTemplate.convertAndSendToUser(
        message.getRecipient(),
        "/queue/messages",
        message);
  }
}
