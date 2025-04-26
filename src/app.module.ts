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
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { UserMiddleware } from './auth/middleware/user.middleware';
import { ProjectsViewController } from './projects/project-view.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects/projects.service';
import { AuthService } from './auth/auth.service';

@Module({
  controllers: [AppController, PromiseController, ProjectsViewController],
  providers: [PrismaService, ProjectsService, AuthService],
  imports: [
    UsersModule,
    DevicesModule,
    ProjectsModule,
    CommentsModule,
    ReviewsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule.forRoot({
      apiDomain: process.env.API_DOMAIN || 'http://localhost:3000',
      apiBasePath: process.env.API_BASE_PATH || '/auth',
      appName: process.env.APP_NAME || 'My App',
      connectionUri:
        process.env.SUPERTOKENS_URI || 'https://try.supertokens.io',
      apiKey: process.env.SUPERTOKENS_API_KEY || 'your-api-key',
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*')
      .apply(UserMiddleware)
      .forRoutes('*');
  }
}
