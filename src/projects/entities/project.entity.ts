import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Project {
  @ApiProperty({ description: 'The unique identifier of the project' })
  id: number;

  @ApiProperty({ description: 'The title of the project' })
  title: string;

  @ApiPropertyOptional({
    description: 'The description of the project',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'The GitHub link of the project',
    nullable: true,
  })
  githubLink?: string | null;

  @ApiProperty({ description: 'The ID of the user who owns this project' })
  userId: number;
}
