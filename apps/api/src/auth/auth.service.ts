import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(user: any) {
    this.cleanExpiredTokens().catch(() => {});
    const payload = { username: user.username, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    this.cleanExpiredTokens().catch(() => {});
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const userId = decoded.sub;

      const dbToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!dbToken || dbToken.expiresAt < new Date()) {
        if (dbToken) {
          await this.prisma.refreshToken.delete({ where: { id: dbToken.id } }).catch(() => {});
        }
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Rotate token: delete old token, create new ones
      await this.prisma.refreshToken.delete({ where: { id: dbToken.id } }).catch(() => {});

      const user = dbToken.user;
      const payload = { username: user.username, sub: user.id, role: user.role };
      const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const newRefreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

      await this.prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } catch (err) {
      // Ignore errors if token already deleted
    }
  }

  private async cleanExpiredTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    }).catch(() => {});
  }
}
