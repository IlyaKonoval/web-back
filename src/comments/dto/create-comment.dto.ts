import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'The text content of the comment',
    example: 'This project looks great! I especially like the user interface.',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({
    description: 'The ID of the user who created this comment',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'The ID of the project this comment belongs to',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  projectId: number;
}
