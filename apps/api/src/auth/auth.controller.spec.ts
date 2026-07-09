/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest
              .fn()
              .mockImplementation((user) =>
                Promise.resolve({ access_token: 'mock-token', refresh_token: 'mock-refresh-token', user }),
              ),
            refresh: jest
              .fn()
              .mockImplementation((token) =>
                Promise.resolve({ access_token: 'new-mock-token', refresh_token: 'new-mock-refresh-token', user: { id: 'user-1' } }),
              ),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('login', () => {
    it('should successfully log in with valid credentials and set cookies', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'USER',
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      const result = await controller.login({
        username: 'testuser',
        password: 'password123',
      }, mockRes);

      expect(result.access_token).toBe('mock-token');
      expect(result.user).toEqual(mockUser);
      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedpassword',
      );
    });

    it('should use cross-site cookie settings in production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const mockUser = {
          id: 'user-1',
          username: 'testuser',
          password: 'hashedpassword',
          role: 'USER',
        };
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const mockRes = {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        } as any;

        await controller.login({
          username: 'testuser',
          password: 'password123',
        }, mockRes);

        expect(mockRes.cookie).toHaveBeenCalledWith(
          'token',
          'mock-token',
          expect.objectContaining({
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
          }),
        );
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'USER',
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      await expect(
        controller.login({ username: 'testuser', password: 'wrongpassword' }, mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      await expect(
        controller.login({ username: 'missinguser', password: 'password123' }, mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-2',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashedpassword',
        role: 'USER',
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await controller.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        id: 'user-2',
        username: 'newuser',
        email: 'new@example.com',
        role: 'USER',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should throw ConflictException if username is already taken', async () => {
      const mockUser = { id: 'user-1', username: 'existinguser' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        controller.register({
          username: 'existinguser',
          email: 'another@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refresh', () => {
    it('should successfully rotate token from refresh token cookie', async () => {
      const mockReq = {
        cookies: { refreshToken: 'existing-refresh-token' },
      } as any;

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      const result = await controller.refresh(mockReq, mockRes);
      expect(result.access_token).toBe('new-mock-token');
      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException if cookie is missing', async () => {
      const mockReq = {
        cookies: {},
      } as any;

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      await expect(controller.refresh(mockReq, mockRes)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully clear cookies and call logout service', async () => {
      const mockReq = {
        cookies: { refreshToken: 'existing-refresh-token' },
      } as any;

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      const result = await controller.logout(mockReq, mockRes);
      expect(result.success).toBe(true);
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
      expect(authService.logout).toHaveBeenCalledWith('existing-refresh-token');
    });
  });
});
