import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Optional username' })
  username?: string;

  @ApiPropertyOptional({ description: 'Optional email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Optional password', minLength: 6 })
  password?: string;
}
