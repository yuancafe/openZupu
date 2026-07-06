/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      refreshToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user and return the object without the password hash', async () => {
    const mockUserResponse = {
      id: 'user-1',
      username: 'test',
      email: 'test@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest
      .spyOn(mockPrisma.user, 'create')
      .mockResolvedValue(mockUserResponse as any);

    const result = await service.create({
      username: 'test',
      email: 'test@example.com',
      password: 'hashed-password',
    });

    expect(result).toEqual(mockUserResponse);
    expect(result).not.toHaveProperty('password');
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        username: 'test',
        email: 'test@example.com',
        password: 'hashed-password',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('should revoke all refresh tokens when password is updated', async () => {
    const mockUserResponse = {
      id: 'user-1',
      username: 'test',
      email: 'test@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest
      .spyOn(mockPrisma.user, 'update')
      .mockResolvedValue(mockUserResponse as any);

    const result = await service.update('user-1', {
      password: 'new-hashed-password',
    });

    expect(result).toEqual(mockUserResponse);
    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });
});
