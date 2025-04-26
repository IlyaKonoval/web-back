import { PartialType } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {
  @ApiPropertyOptional({
    description: 'Optional user agent string',
    example:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
  })
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Optional login time of the device',
    type: Date,
  })
  loginTime?: Date;

  @ApiPropertyOptional({
    description: 'Optional user ID',
    example: 2,
  })
  userId?: number;
}
