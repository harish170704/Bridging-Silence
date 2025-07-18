package com.example.accessiblechat.model;

public class ChatMessage {
  private String sender;
  private String recipient; // main field for backend
  private String receiver; // optional, maps same value as recipient
  private String content;
  private String timestamp;

  public ChatMessage() {
  }

  public ChatMessage(String sender, String recipient, String content, String timestamp) {
    this.sender = sender;
    this.recipient = recipient;
    this.receiver = recipient; // keep both in sync
    this.content = content;
    this.timestamp = timestamp;
  }

  public String getSender() {
    return sender;
  }

  public void setSender(String sender) {
    this.sender = sender;
  }

  public String getRecipient() {
    return recipient;
  }

  public void setRecipient(String recipient) {
    this.recipient = recipient;
    this.receiver = recipient; // keep in sync
  }

  public String getReceiver() {
    return receiver;
  }

  public void setReceiver(String receiver) {
    this.receiver = receiver;
    this.recipient = receiver; // keep in sync
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public String getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(String timestamp) {
    this.timestamp = timestamp;
  }
}
