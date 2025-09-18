import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Inject, forwardRef } from '@nestjs/common';
import { config } from '../config';
import { ChatService } from './chat.service';
import { JwtUserPayload } from './dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwt.verifyAsync(token, {
        secret: config.JWT_SECRET,
      });
      (client.data as any).user = payload; // store in socket data
      this.chatService.setUserOnline(payload.id);

      const chats = await this.chatService.listUserChats(payload.id);
      for (const c of chats) client.join(`chat:${c.id}`);
      client.join(`user:${payload.id}`);
      client.emit('connected', { ok: true });

      for (const c of chats) {
        this.server.to(`chat:${c.id}`).emit('user_online', {
          userId: payload.id,
          chatId: c.id,
        });
      }
    } catch (e) {
      client.emit('error', 'Unauthorized');
      client.disconnect(true);
    }
  }

  private extractToken(client: Socket) {
    const header = client.handshake.headers['authorization'];
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    const token = client.handshake.auth?.token as string | undefined;
    if (token) return token;
    throw new Error('No token');
  }

  async handleDisconnect(client: Socket) {
    try {
      const user = (client.data as any).user as JwtUserPayload | undefined;
      if (!user) return;

      let stillConnected = false;
      try {
        const sockets = this.server.sockets?.sockets;
        if (sockets) {
          for (const [_id, sock] of Object.entries(sockets)) {
            if ((sock as any).id === client.id) continue;
            const sUser = ((sock as any).data as any)?.user as
              | JwtUserPayload
              | undefined;
            if (sUser && sUser.id === user.id) {
              stillConnected = true;
              break;
            }
          }
        }
      } catch (error) {
        console.warn('Error checking connected sockets:', error);
      }

      if (!stillConnected) {
        this.chatService.setUserOffline(user.id);
        const chats = await this.chatService.listUserChats(user.id);
        for (const c of chats) {
          this.server.to(`chat:${c.id}`).emit('user_offline', {
            userId: user.id,
            chatId: c.id,
          });
        }
      }
    } catch (e) {
      console.warn('[ChatGateway] handleDisconnect error', e);
    }
  }

  @SubscribeMessage('send_message')
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { chatId: string; content: string },
  ) {
    const user = (client.data as any).user as JwtUserPayload;
    const message = await this.chatService.sendMessage(
      user.id,
      body.chatId,
      body.content,
    );
    this.server.to(`chat:${body.chatId}`).emit('new_message', message);

    try {
      const participantIds = await this.chatService.getChatParticipantIds(
        body.chatId,
      );
      for (const uid of participantIds) {
        this.server.to(`user:${uid}`).emit('new_message', message);
      }
    } catch (e) {
      try {
        client.emit('new_message', message);
      } catch (err) {}
    }
    return { ok: true };
  }

  @SubscribeMessage('join_chat')
  async onJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { chatId: string },
  ) {
    const user = (client.data as any).user as JwtUserPayload;
    const chats = await this.chatService.listUserChats(user.id);
    const allowed = chats.some((c: any) => c.id === body.chatId);
    if (allowed) client.join(`chat:${body.chatId}`);
    return { ok: allowed };
  }

  notifyNewChat(userId: string, chatData: any) {
    this.server.to(`user:${userId}`).emit('new_chat', chatData);
  }

  notifyChatDeleted(userId: string, chatId: string) {
    this.server.to(`user:${userId}`).emit('chat_deleted', { chatId });
  }
}
