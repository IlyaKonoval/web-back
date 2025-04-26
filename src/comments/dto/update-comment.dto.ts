import { PartialType } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @ApiPropertyOptional({
    description: 'Optional updated text content of the comment',
    example:
      'I have revised my thoughts: This project is even better than I initially thought!',
  })
  @IsOptional()
  @IsString()
  text?: string;
}
