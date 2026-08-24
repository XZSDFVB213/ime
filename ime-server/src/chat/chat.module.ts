import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaService } from 'src/prisma.service';
import { ChatsGateway } from './chats.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [ChatsController],
  providers: [ChatsService, PrismaService, ChatsGateway, JwtService],
  exports: [ChatsService, ChatsGateway],
})
export class ChatModule {}
