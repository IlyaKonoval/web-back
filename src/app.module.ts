import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PromiseController } from './promise.controller';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController, PromiseController],
  providers: [],
  imports: [UsersModule],
})
export class AppModule {}
