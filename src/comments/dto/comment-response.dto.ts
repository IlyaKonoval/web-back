import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({ description: 'The unique identifier of the comment' })
  id: number;

  @ApiProperty({
    description: 'The text content of the comment',
    example: 'This project looks great! I especially like the user interface.',
  })
  text: string;

  @ApiProperty({ description: 'The creation date of the comment', type: Date })
  createdAt: Date;

  @ApiProperty({
    description: 'The ID of the user who created this comment',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'The ID of the project this comment belongs to',
    example: 1,
  })
  projectId: number;

  @ApiPropertyOptional({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      username: { type: 'string', example: 'johndoe' },
      email: { type: 'string', example: 'johndoe@example.com' },
    },
  })
  user?: {
    id: number;
    username: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Project information',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'E-commerce Platform' },
    },
  })
  project?: {
    id: number;
    title: string;
  };
}
