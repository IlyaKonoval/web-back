import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../auth/user.model';

@ObjectType({ description: 'Device object type' })
export class Device {
  @Field(() => ID, { description: 'The unique identifier of the device' })
  id: number;

  @Field({ description: 'The user agent string of the device' })
  userAgent: string;

  @Field({ description: 'The login time of the device' })
  loginTime: Date;

  @Field(() => User, { description: 'The user who owns this device' })
  user: User;

  @Field(() => ID, { description: 'The ID of the user who owns this device' })
  userId: number;
}
