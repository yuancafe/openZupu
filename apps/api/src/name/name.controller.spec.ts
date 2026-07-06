import { Test, TestingModule } from '@nestjs/testing';
import { NameController } from './name.controller';
import { NameService } from './name.service';

describe('NameController', () => {
  let controller: NameController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NameController],
      providers: [
        {
          provide: NameService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NameController>(NameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
