import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;

  @Field()
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  username: string;
}
