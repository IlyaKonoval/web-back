import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({ description: 'The unique identifier of the project' })
  id: number;

  @ApiProperty({
    description: 'The title of the project',
    example: 'E-commerce Platform',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'The description of the project',
    example:
      'A full-stack e-commerce platform with user authentication, product catalog, and payment processing',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'The GitHub link of the project',
    example: 'https://github.com/username/e-commerce-platform',
    nullable: true,
  })
  githubLink?: string | null;

  @ApiProperty({
    description: 'The ID of the user who owns this project',
    example: 1,
  })
  userId: number;

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
}
