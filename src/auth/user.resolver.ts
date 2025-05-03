import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { User } from './user.model';
import { CreateUserInput } from './create-user.input';
import { RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Project } from '../projects/project.model';
import { Comment } from '../comments/comment.type';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [User])
  users(): Promise<User[]> {
    return this.authService.getAllUsers();
  }

  @Query(() => User)
  async user(@Args('id') id: number): Promise<User> {
    const user = await this.authService.getUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    const registerDto: RegisterDto = {
      email: input.email,
      password: input.password,
      confirmPassword: input.confirmPassword ?? input.password, // безопасная подстановка
      name: input.name,
    };
    return this.authService.register(registerDto);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Args('id') id: number): Promise<string> {
    await this.authService.deleteUser(id);
    return 'User deleted successfully';
  }

  @ResolveField(() => [Project])
  async projects(@Parent() user: User): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { userId: user.id },
    });
  }

  @ResolveField(() => [Comment])
  async comments(@Parent() user: User): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { userId: user.id },
    });
  }
}
