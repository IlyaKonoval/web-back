import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { PromiseController } from './promise.controller';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';

import { ConfigModule } from '@nestjs/config';

import { ProjectsViewController } from './projects/project-view.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects/projects.service';
import { AuthMiddleware } from './auth/auth.middleware';

@Module({
  controllers: [AppController, PromiseController, ProjectsViewController],
  providers: [PrismaService, ProjectsService],
  imports: [
    UsersModule,
    DevicesModule,
    ProjectsModule,
    CommentsModule,
    ReviewsModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*'); // Применяем middleware ко всем маршрутам
  }
}
