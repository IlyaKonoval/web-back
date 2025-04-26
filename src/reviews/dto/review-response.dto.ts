import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({ description: 'The unique identifier of the review' })
  id: number;

  @ApiProperty({
    description: 'The text content of the review',
    example:
      'This project is well implemented with clean code and useful features.',
  })
  text: string;

  @ApiProperty({
    description: 'The rating given in the review (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @ApiProperty({ description: 'The creation date of the review', type: Date })
  createdAt: Date;

  @ApiProperty({
    description: 'The ID of the user who created this review',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'The ID of the project this review belongs to',
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
