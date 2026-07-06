import { Test, TestingModule } from '@nestjs/testing';
import { GedcomController } from './gedcom.controller';
import { GedcomService } from './gedcom.service';
import { ProjectService } from '../project/project.service';

describe('GedcomController', () => {
  let controller: GedcomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GedcomController],
      providers: [
        {
          provide: GedcomService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            login: jest.fn(),
          },
        },
        {
          provide: ProjectService,
          useValue: {
            checkProjectAccess: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<GedcomController>(GedcomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
