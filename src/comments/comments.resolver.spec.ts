import { Test, TestingModule } from '@nestjs/testing';
import { CommentsResolver } from './comments.resolver';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// Mock data
const mockComment = {
  id: 1,
  text: 'Test comment',
  createdAt: new Date(),
  userId: 1,
  projectId: 1,
  user: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  },
  project: {
    id: 1,
    title: 'Test Project',
  },
};

const mockComments = [
  mockComment,
  {
    id: 2,
    text: 'Another test comment',
    createdAt: new Date(),
    userId: 2,
    projectId: 1,
    user: {
      id: 2,
      username: 'anotheruser',
      email: 'another@example.com',
    },
    project: {
      id: 1,
      title: 'Test Project',
    },
  },
];

// Mock service
const mockCommentsService = {
  findAll: jest.fn().mockResolvedValue(mockComments),
  findOne: jest.fn().mockImplementation((id: number) => {
    const comment = mockComments.find((c) => c.id === id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return Promise.resolve(comment);
  }),
  findByProjectId: jest.fn().mockImplementation((projectId: number) => {
    return Promise.resolve(
      mockComments.filter((c) => c.projectId === projectId),
    );
  }),
  findByUserId: jest.fn().mockImplementation((userId: number) => {
    return Promise.resolve(mockComments.filter((c) => c.userId === userId));
  }),
  create: jest.fn().mockImplementation((createCommentDto) => {
    const newComment = {
      id: 3,
      text: createCommentDto.text,
      createdAt: new Date(),
      userId: createCommentDto.userId,
      projectId: createCommentDto.projectId,
      user: {
        id: createCommentDto.userId,
        username: 'testuser',
        email: 'test@example.com',
      },
      project: {
        id: createCommentDto.projectId,
        title: 'Test Project',
      },
    };
    return Promise.resolve(newComment);
  }),
  remove: jest.fn().mockResolvedValue(true),
};

// Mock Prisma service
const mockPrismaService = {
  user: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      return Promise.resolve({
        id: where.id,
        username: 'testuser',
        email: 'test@example.com',
      });
    }),
  },
  project: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      return Promise.resolve({
        id: where.id,
        title: 'Test Project',
      });
    }),
  },
};

describe('CommentsResolver', () => {
  let resolver: CommentsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsResolver,
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<CommentsResolver>(CommentsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('comments', () => {
    it('should return an array of comments', async () => {
      const result = await resolver.comments(0, 10);
      expect(result).toEqual(mockComments);
      expect(mockCommentsService.findAll).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('comment', () => {
    it('should return a comment by id', async () => {
      const result = await resolver.comment(1);
      expect(result).toEqual(mockComment);
      expect(mockCommentsService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when comment not found', async () => {
      await expect(resolver.comment(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('commentsByProject', () => {
    it('should return comments by project id', async () => {
      const result = await resolver.commentsByProject(1);
      expect(result).toEqual(mockComments);
      expect(mockCommentsService.findByProjectId).toHaveBeenCalledWith(1);
    });
  });

  describe('commentsByUser', () => {
    it('should return comments by user id', async () => {
      const result = await resolver.commentsByUser(1);
      expect(result).toEqual([mockComment]);
      expect(mockCommentsService.findByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const input = { comment: 'New comment', projectId: 1 };
      const context = { req: { user: { id: 1 } } };

      const result = await resolver.createComment(input, context);

      expect(result).toEqual({
        id: 3,
        text: 'New comment',
        createdAt: expect.any(Date),
        userId: 1,
        projectId: 1,
        user: expect.any(Object),
        project: expect.any(Object),
      });

      expect(mockCommentsService.create).toHaveBeenCalledWith({
        text: 'New comment',
        userId: 1,
        projectId: 1,
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const context = { req: { user: { id: 1 } } };
      const result = await resolver.deleteComment(1, context);

      expect(result).toBe(true);
      expect(mockCommentsService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('ResolveField methods', () => {
    it('should resolve user field', async () => {
      const result = await resolver.user(mockComment);

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should resolve project field', async () => {
      const result = await resolver.project(mockComment);

      expect(result).toEqual({
        id: 1,
        title: 'Test Project',
      });

      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
