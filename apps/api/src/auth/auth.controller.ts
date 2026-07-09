import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ConflictException,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import * as express from 'express';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { username, password } = body;
    const user = await this.prisma.user.findUnique({ where: { username } });

    // Timing attack defense: dummy compare if user doesn't exist
    const dummyHash =
      '$2b$12$K.x12sW3Z97z0uS8vA6zOuF7rJyNlP6hV2eT4yU9iO0pQsRxTyUiS';
    const dbHash = user ? user.password : dummyHash;
    const isPasswordValid = await bcrypt.compare(password, dbHash);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.authService.login(user);

    // Set HTTP-only cookies
    res.cookie('token', tokens.access_token, {
      ...this.authCookieOptions(),
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', tokens.refresh_token, {
      ...this.authCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return tokens;
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { username, email, password } = body;

    const existing = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Request() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokens = await this.authService.refresh(refreshToken);

    // Set new cookies
    res.cookie('token', tokens.access_token, {
      ...this.authCookieOptions(),
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refresh_token, {
      ...this.authCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return tokens;
  }

  @Public()
  @Post('logout')
  async logout(
    @Request() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('token', this.authCookieOptions());
    res.clearCookie('refreshToken', this.authCookieOptions());

    return { success: true };
  }

  private authCookieOptions(): express.CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    };
  }
}
