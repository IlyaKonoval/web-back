import { registerEnumType } from '@nestjs/graphql';
import { Role } from './interfaces/user.interface';

registerEnumType(Role, {
  name: 'Role',
  description: 'User role types',
});
