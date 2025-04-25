import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersViewController } from './users-view.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersApiController } from './users-api.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, UsersViewController, UsersApiController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
