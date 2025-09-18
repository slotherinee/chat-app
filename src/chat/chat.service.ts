import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  private readonly onlineUsers = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  setUserOnline(userId: string) {
    this.onlineUsers.add(userId);
  }

  setUserOffline(userId: string) {
    this.onlineUsers.delete(userId);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  async listUserChats(userId: string): Promise<any[]> {
    const chats = await this.prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: { include: { user: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    return chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p.userId !== userId,
      );
      const otherUser = otherParticipant?.user;
      const lastMessage = chat.messages[0];

      return {
        id: chat.id,
        name: otherUser?.name || otherUser?.username || 'Chat',
        participantId: otherUser?.id,
        isOnline: otherUser ? this.isUserOnline(otherUser.id) : false,
        unreadCount: 0,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              timestamp: new Date(lastMessage.createdAt),
            }
          : null,
        messages: [],
        avatarUrl: otherUser?.avatarUrl || null,
        _loaded: false,
        participants: chat.participants,
      };
    });
  }

  async getChatMessages(
    userId: string,
    chatId: string,
    take = 50,
    cursor?: string,
  ): Promise<any[]> {
    const isParticipant = await this.prisma.chatParticipant.findFirst({
      where: { chatId, userId },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    return await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: { sender: true },
    });
  }

  async createDirectChat(requesterId: string, otherUserId: string) {
    const chat = await this.prisma.chat.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: requesterId, role: 'member' },
            { userId: otherUserId, role: 'member' },
          ],
        },
      },
      include: { participants: { include: { user: true } } },
    });

    const otherParticipant = chat.participants.find(
      (p) => p.userId !== requesterId,
    );
    const otherUser = otherParticipant?.user;

    const chatData = {
      id: chat.id,
      name: otherUser?.name || otherUser?.username || 'Chat',
      participantId: otherUser?.id,
      isOnline: otherUser ? this.isUserOnline(otherUser.id) : false,
      unreadCount: 0,
      lastMessage: null,
      messages: [],
      avatarUrl: otherUser?.avatarUrl || null,
      _loaded: false,
      participants: chat.participants,
    };

    return chatData;
  }

  async sendMessage(
    userId: string,
    chatId: string,
    content: string,
  ): Promise<any> {
    const isParticipant = await this.prisma.chatParticipant.findFirst({
      where: { chatId, userId },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const existingMessagesCount = await this.prisma.message.count({
      where: { chatId },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { chatId, senderId: userId, content },
        include: { sender: true },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      return message;
    });

    if (existingMessagesCount === 0) {
      const otherParticipant = await this.getOtherParticipant(userId, chatId);
      if (otherParticipant) {
        const senderUser = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (senderUser) {
          const chatData = {
            id: chatId,
            name: senderUser.name || senderUser.username || 'Chat',
            participantId: senderUser.id,
            isOnline: this.isUserOnline(senderUser.id),
            unreadCount: 0,
            lastMessage: {
              content: result.content,
              timestamp: new Date(result.createdAt),
            },
            messages: [
              {
                id: result.id,
                content: result.content,
                senderId: userId,
                sent: false,
                timestamp: new Date(result.createdAt),
                status: 'sent',
              },
            ],
            avatarUrl: senderUser.avatarUrl || null,
            _loaded: false,
            participants: [],
          };

          this.chatGateway.notifyNewChat(otherParticipant.userId, chatData);
        }
      }
    }

    return result;
  }

  async getOtherParticipant(userId: string, chatId: string) {
    const otherParticipant = await this.prisma.chatParticipant.findFirst({
      where: { chatId, userId: { not: userId } },
      include: { user: true },
    });
    return otherParticipant;
  }

  async getChatParticipantIds(chatId: string): Promise<string[]> {
    const parts = await this.prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });
    return parts.map((p) => p.userId);
  }

  async deleteChat(
    userId: string,
    chatId: string,
  ): Promise<{ success: boolean }> {
    const isParticipant = await this.prisma.chatParticipant.findFirst({
      where: { chatId, userId },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const otherParticipant = await this.getOtherParticipant(userId, chatId);

    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    if (otherParticipant) {
      this.chatGateway.notifyChatDeleted(otherParticipant.userId, chatId);
    }

    return { success: true };
  }
}
