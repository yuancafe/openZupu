/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectService } from '../project/project.service';

describe('McpService', () => {
  let service: McpService;
  let mockPrisma: any;
  let mockProjectService: any;

  beforeEach(async () => {
    mockPrisma = {
      person: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      kinshipRelation: {
        create: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
      revision: {
        create: jest.fn(),
      },
    };

    mockProjectService = {
      findAll: jest.fn(),
      checkProjectAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
  });

  describe('listTools', () => {
    it('should return all 7 tools', async () => {
      const tools = await service.listTools();
      expect(tools).toHaveLength(7);
      expect(tools.map((t) => t.name)).toContain('list_projects');
      expect(tools.map((t) => t.name)).toContain('search_persons');
      expect(tools.map((t) => t.name)).toContain('get_person_details');
      expect(tools.map((t) => t.name)).toContain('create_person');
      expect(tools.map((t) => t.name)).toContain('add_kinship_relation');
      expect(tools.map((t) => t.name)).toContain('find_duplicates');
      expect(tools.map((t) => t.name)).toContain('export_graphml');
    });
  });

  describe('callTool', () => {
    const mockUser = { userId: 'user-1', isAdmin: false };

    it('should call list_projects successfully', async () => {
      const mockProjects = [{ id: 'p-1', name: 'Zupu 1' }];
      mockProjectService.findAll.mockResolvedValue(mockProjects);

      const res = await service.callTool('list_projects', {}, mockUser.userId, mockUser.isAdmin);
      expect(mockProjectService.findAll).toHaveBeenCalledWith(mockUser.userId, mockUser.isAdmin);
      expect(res.content[0].text).toContain('Zupu 1');
    });

    it('should search persons with name query', async () => {
      const mockPersons = [{ id: 'person-1', surname: 'Zhang', givenName: 'San' }];
      mockPrisma.person.findMany.mockResolvedValue(mockPersons);

      const res = await service.callTool(
        'search_persons',
        { projectId: 'project-1', query: 'Zhang' },
        mockUser.userId,
        mockUser.isAdmin,
      );

      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith('project-1', mockUser.userId, 'VIEWER');
      expect(res.content[0].text).toContain('Zhang');
    });

    it('should retrieve person details with nested relationships', async () => {
      const mockPerson = {
        id: 'person-1',
        projectId: 'project-1',
        surname: 'Zhang',
        givenName: 'San',
        relationsAsFrom: [],
        relationsAsTo: [],
      };
      mockPrisma.person.findUnique.mockResolvedValue(mockPerson);

      const res = await service.callTool(
        'get_person_details',
        { personId: 'person-1' },
        mockUser.userId,
        mockUser.isAdmin,
      );

      expect(mockPrisma.person.findUnique).toHaveBeenCalled();
      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith('project-1', mockUser.userId, 'VIEWER');
      expect(res.content[0].text).toContain('Zhang');
    });

    it('should create a person card and log revision', async () => {
      const mockPerson = { id: 'new-p', projectId: 'project-1', surname: 'Zhang', givenName: 'San' };
      mockPrisma.person.create.mockResolvedValue(mockPerson);

      const res = await service.callTool(
        'create_person',
        { projectId: 'project-1', surname: 'Zhang', givenName: 'San' },
        mockUser.userId,
        mockUser.isAdmin,
      );

      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith('project-1', mockUser.userId, 'EDITOR');
      expect(mockPrisma.person.create).toHaveBeenCalled();
      expect(mockPrisma.revision.create).toHaveBeenCalled();
      expect(res.content[0].text).toContain('Successfully created person');
    });

    it('should establish kinship relation and log revision', async () => {
      const mockFather = { id: 'father-1', projectId: 'project-1' };
      const mockChild = { id: 'child-1', projectId: 'project-1' };
      const mockRelation = { id: 'rel-1', fromPersonId: 'father-1', toPersonId: 'child-1' };

      mockPrisma.person.findUnique
        .mockResolvedValueOnce(mockFather)
        .mockResolvedValueOnce(mockChild);
      mockPrisma.kinshipRelation.create.mockResolvedValue(mockRelation);

      const res = await service.callTool(
        'add_kinship_relation',
        {
          projectId: 'project-1',
          fromPersonId: 'father-1',
          toPersonId: 'child-1',
          relationType: 'BIOLOGICAL_FATHER_OF',
        },
        mockUser.userId,
        mockUser.isAdmin,
      );

      expect(mockProjectService.checkProjectAccess).toHaveBeenCalledWith('project-1', mockUser.userId, 'EDITOR');
      expect(mockPrisma.kinshipRelation.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          fromPersonId: 'father-1',
          toPersonId: 'child-1',
          relationType: 'BIOLOGICAL_FATHER_OF',
          inverseRelationType: 'BIOLOGICAL_CHILD_OF',
          status: 'CONFIRMED',
        },
      });
      expect(mockPrisma.revision.create).toHaveBeenCalled();
      expect(res.content[0].text).toContain('Successfully established kinship relation');
    });
  });
});
