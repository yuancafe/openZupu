import { Test, TestingModule } from '@nestjs/testing';
import { KinshipRelationController } from './kinship-relation.controller';
import { KinshipRelationService } from './kinship-relation.service';

describe('KinshipRelationController', () => {
  let controller: KinshipRelationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KinshipRelationController],
      providers: [
        {
          provide: KinshipRelationService,
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

    controller = module.get<KinshipRelationController>(
      KinshipRelationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
