import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({
    description: 'The user agent string of the device',
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  })
  @IsNotEmpty()
  @IsString()
  userAgent: string;

  @ApiProperty({
    description: 'The ID of the user who owns this device',
    example: 1,
  })
  @IsNotEmpty()
  userId: number;
}
