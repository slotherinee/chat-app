export interface JwtUserPayload {
  id: string;
  username: string;
}

export interface SendMessageDto {
  chatId: string;
  content: string;
}
