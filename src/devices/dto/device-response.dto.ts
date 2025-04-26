import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceResponseDto {
  @ApiProperty({ description: 'The unique identifier of the device' })
  id: number;

  @ApiProperty({
    description: 'The user agent string of the device',
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  })
  userAgent: string;

  @ApiProperty({ description: 'The login time of the device', type: Date })
  loginTime: Date;

  @ApiProperty({
    description: 'The ID of the user who owns this device',
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
