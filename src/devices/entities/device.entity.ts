import { ApiProperty } from '@nestjs/swagger';

export class Device {
  @ApiProperty({ description: 'The unique identifier of the device' })
  id: number;

  @ApiProperty({ description: 'The user agent string of the device' })
  userAgent: string;

  @ApiProperty({ description: 'The login time of the device', type: Date })
  loginTime: Date;

  @ApiProperty({ description: 'The ID of the user who owns this device' })
  userId: number;
}
