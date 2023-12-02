enum MessageRole {
  User = "user",
  Assistant = "assistant",
}

interface Message {
  id: string;
  role: MessageRole;
  text: string;
}

export { Message, MessageRole };
