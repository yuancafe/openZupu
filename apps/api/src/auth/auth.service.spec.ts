/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should sign user payload and return access_token', async () => {
      const user = { id: 'user-123', username: 'testuser', role: 'USER' };
      const result = await service.login(user);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refresh_token).toBe('mock-jwt-token');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate token and return new credentials when valid', async () => {
      const tokenStr = 'valid-refresh-token';
      const mockDecoded = { sub: 'user-123' };
      const mockDbToken = {
        id: 'rt-123',
        token: tokenStr,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'user-123', username: 'testuser', role: 'USER' },
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockDecoded);
      jest.spyOn(mockPrisma.refreshToken, 'findUnique').mockResolvedValue(mockDbToken);

      const result = await service.refresh(tokenStr);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refresh_token).toBe('mock-jwt-token');
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-123' },
      });
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when JWT is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('JWT expired');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is not found in database', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(mockPrisma.refreshToken, 'findUnique').mockResolvedValue(null);

      await expect(service.refresh('missing-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException and delete token if token is expired', async () => {
      const expiredDate = new Date(Date.now() - 100000);
      const mockDbToken = {
        id: 'rt-123',
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: expiredDate,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(mockPrisma.refreshToken, 'findUnique').mockResolvedValue(mockDbToken);

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-123' },
      });
    });
  });

  describe('logout', () => {
    it('should call deleteMany to revoke the token', async () => {
      await service.logout('some-refresh-token');
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-refresh-token' },
      });
    });
  });
});
