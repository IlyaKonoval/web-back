import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'The title of the project',
    example: 'E-commerce Platform',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'The description of the project',
    example:
      'A full-stack e-commerce platform with user authentication, product catalog, and payment processing',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The GitHub link of the project',
    example: 'https://github.com/username/e-commerce-platform',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'GitHub link must be a valid URL' })
  githubLink?: string;

  @ApiProperty({
    description: 'The ID of the user who owns this project',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  userId: number;
}
