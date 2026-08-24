/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body()
    dto: LoginDto,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const result = await this.authService.login(dto);

    this.setRefreshCookie(response, result.refreshToken);

    /*
     * Refresh token Angular вообще
     * не отдаём.
     */
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  async refresh(
    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const refreshToken = request.cookies?.['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token отсутствует');
    }

    const result = await this.authService.refresh(refreshToken);

    /*
     * Делаем rotation:
     * старый refresh больше
     * использовать нельзя.
     */
    this.setRefreshCookie(response, result.refreshToken);

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  async logout(
    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const refreshToken = request.cookies?.['refreshToken'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie('refreshToken', {
      httpOnly: true,

      secure: process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      path: '/',
    });

    return {
      success: true,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @Req()
    req: any,
  ) {
    return this.authService.getMe(req.user.id);
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,

      secure: process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      path: '/',

      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}
