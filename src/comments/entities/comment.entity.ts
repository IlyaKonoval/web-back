import { ApiProperty } from '@nestjs/swagger';

export class Comment {
  @ApiProperty({ description: 'The unique identifier of the comment' })
  id: number;

  @ApiProperty({ description: 'The text content of the comment' })
  text: string;

  @ApiProperty({ description: 'The creation date of the comment', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'The ID of the user who created this comment' })
  userId: number;

  @ApiProperty({ description: 'The ID of the project this comment belongs to' })
  projectId: number;
}
