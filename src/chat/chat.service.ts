import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async listUserChats(userId: string): Promise<any[]> {
    return await this.prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: { include: { user: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
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
    return chat;
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

    const message = await this.prisma.message.create({
      data: { chatId, senderId: userId, content },
      include: { sender: true },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  async deleteChat(
    userId: string,
    chatId: string,
  ): Promise<{ success: boolean }> {
    const isParticipant = await this.prisma.chatParticipant.findFirst({
      where: { chatId, userId },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    await this.prisma.chat.delete({
      where: { id: chatId },
    });
    return { success: true };
  }
}
