/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    try {
      return this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          fullName: dto.fullName,

          roles: {
            create: {
              role: Role.STUDENT,
            },
          },
        },

        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          createdAt: true,

          roles: {
            select: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      // Handle the error here
      console.error('Error creating user:', error);
      throw error; // or return an error response, etc.
    }
  }
  private async generateTokens(userId: string, email: string) {
    const payload = {
      sub: userId,
      email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,

      expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,

      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: hash,
      },
    });
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email.trim(),
      },

      include: {
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    /*
     * Если статус у тебя реально используется,
     * лучше сразу не пускать BLOCKED/DELETED.
     */
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Учетная запись недоступна');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,

        email: user.email,

        fullName: user.fullName,

        status: user.status,

        roles: user.roles.map((item) => item.role),
      },

      accessToken: tokens.accessToken,

      refreshToken: tokens.refreshToken,
    };
  }
  async refresh(refreshToken: string) {
    /*
     * Сначала проверяем подпись
     * и срок действия refresh JWT.
     */
    let payload: {
      sub: string;
      email: string;
    };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token недействителен или истёк');
    }

    /*
     * Ищем пользователя.
     */
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },

      include: {
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Сессия недействительна');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Учетная запись недоступна');
    }

    /*
     * В БД лежит bcrypt-хэш.
     * Сравниваем пришедший refresh
     * с сохранённым.
     */
    const refreshMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshMatches) {
      throw new UnauthorizedException('Refresh token недействителен');
    }

    /*
     * Генерируем НОВУЮ пару.
     */
    const tokens = await this.generateTokens(user.id, user.email);

    /*
     * И старый refresh заменяется
     * новым хэшем.
     */
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,

      refreshToken: tokens.refreshToken,
    };
  }
  async logout(refreshToken: string) {
    let payload: {
      sub: string;
    };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      /*
       * Cookie всё равно controller удалит.
       */
      return;
    }

    await this.prisma.user.updateMany({
      where: {
        id: payload.sub,
      },

      data: {
        refreshToken: null,
      },
    });
  }
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,

        roles: {
          select: {
            role: true,
          },
        },

        student: {
          select: {
            id: true,
            groupId: true,

            group: {
              select: {
                id: true,
                name: true,

                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },

        teacher: {
          select: {
            id: true,
            position: true,
            departmentId: true,

            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      ...user,
      roles: user.roles.map((item) => item.role),
    };
  }
}
