package com.example.accessiblechat.Controller;

import com.example.accessiblechat.model.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        if (chatMessage.getRecipient() == null || chatMessage.getRecipient().isEmpty()) {
            System.err.println("❌ Recipient missing in chat message!");
            return;
        }

        if (chatMessage.getSender() == null || chatMessage.getSender().isEmpty()) {
            System.err.println("❌ Sender missing in chat message!");
            return;
        }

        // Add timestamp
        chatMessage.setTimestamp(LocalDateTime.now().toString());

        // Log received message
        System.out.println("📥 Received message from " + chatMessage.getSender() + " to " +
                chatMessage.getRecipient() + ": " + chatMessage.getContent());

        // Send to specific user
        try {
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getRecipient(),
                    "/queue/messages",
                    chatMessage);
            System.out.println("✅ Message sent to recipient " + chatMessage.getRecipient());
        } catch (Exception e) {
            System.err.println("❌ Failed to send message to " + chatMessage.getRecipient() + ": " + e.getMessage());
        }
    }
}
