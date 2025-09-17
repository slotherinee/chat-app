import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
type RequestUser = { id: string; username: string };

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  async list(@Req() req: { user: RequestUser }) {
    const userId = req.user.id;
    return this.chatService.listUserChats(userId);
  }

  @Get(':id/messages')
  async messages(
    @Req() req: { user: RequestUser },
    @Param('id') chatId: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    const userId = req.user.id;
    const t = take ? parseInt(take, 10) : 50;
    return this.chatService.getChatMessages(userId, chatId, t, cursor);
  }

  @Post('direct')
  async createDirect(
    @Req() req: { user: RequestUser },
    @Body() body: { otherUserId: string },
  ) {
    const userId = req.user.id;
    return this.chatService.createDirectChat(userId, body.otherUserId);
  }

  @Delete(':id')
  async deleteChat(
    @Req() req: { user: RequestUser },
    @Param('id') chatId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.deleteChat(userId, chatId);
  }
}
