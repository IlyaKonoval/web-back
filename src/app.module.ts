import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { PromiseController } from './promise.controller';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';
import { Request } from 'express';

import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { ProjectsViewController } from './projects/project-view.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects/projects.service';
import { AuthMiddleware } from './auth/auth.middleware';

interface GqlContext {
  req: Request;
}

@Module({
  controllers: [AppController, PromiseController, ProjectsViewController],
  providers: [PrismaService, ProjectsService, AuthMiddleware],
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      context: ({ req }): GqlContext => ({ req }),
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
