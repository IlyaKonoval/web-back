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

@Module({
  controllers: [AppController, PromiseController],
  providers: [],
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
      apiDomain: process.env.SUPERTOKENS_API_DOMAIN || 'http://localhost:3000',
      apiBasePath: process.env.SUPERTOKENS_API_BASE_PATH || '/auth/api',
      appName: process.env.SUPERTOKENS_APP_NAME || 'Portfolio App',
      connectionUri:
        process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.com',
      apiKey: process.env.SUPERTOKENS_API_KEY || '',
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