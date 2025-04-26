import { ApiProperty } from '@nestjs/swagger';

export class Review {
  @ApiProperty({ description: 'The unique identifier of the review' })
  id: number;

  @ApiProperty({ description: 'The text content of the review' })
  text: string;

  @ApiProperty({
    description: 'The rating given in the review (1-5)',
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @ApiProperty({ description: 'The creation date of the review', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'The ID of the user who created this review' })
  userId: number;

  @ApiProperty({ description: 'The ID of the project this review belongs to' })
  projectId: number;
}
