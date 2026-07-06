/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

describe('McpController', () => {
  let controller: McpController;
  let mockMcpService: any;

  beforeEach(async () => {
    mockMcpService = {
      listTools: jest.fn(),
      callTool: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [McpController],
      providers: [
        {
          provide: McpService,
          useValue: mockMcpService,
        },
      ],
    }).compile();

    controller = module.get<McpController>(McpController);
  });

  describe('listTools', () => {
    it('should return tools list', async () => {
      mockMcpService.listTools.mockResolvedValue([{ name: 'tool-1' }]);
      const res = await controller.listTools();
      expect(res.tools).toHaveLength(1);
      expect(res.tools[0].name).toBe('tool-1');
    });
  });

  describe('callTool', () => {
    it('should invoke callTool with request parameters', async () => {
      const mockReq = { user: { userId: 'user-123', role: 'MEMBER' } };
      mockMcpService.callTool.mockResolvedValue({ content: [] });

      await controller.callTool(
        { name: 'tool-x', arguments: { arg1: 'val1' } },
        mockReq as any,
      );

      expect(mockMcpService.callTool).toHaveBeenCalledWith(
        'tool-x',
        { arg1: 'val1' },
        'user-123',
        false,
      );
    });
  });
});
