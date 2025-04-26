import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsInt } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({
    description: 'Optional title of the project',
    example: 'Updated E-commerce Platform',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional description of the project',
    example: 'An updated full-stack e-commerce platform with enhanced features',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional GitHub link of the project',
    example: 'https://github.com/username/updated-e-commerce-platform',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'GitHub link must be a valid URL' })
  githubLink?: string;

  @ApiPropertyOptional({
    description: 'Optional user ID',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  userId?: number;
}
