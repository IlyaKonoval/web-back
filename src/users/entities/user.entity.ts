import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ writeOnly: true })
  password: string;

  @ApiProperty({ type: Date })
  registrationDate: Date;
}
