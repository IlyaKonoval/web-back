import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersViewController } from './users-view.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersApiController } from './users-api.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule.forRoot({
      apiDomain: process.env.SUPERTOKENS_API_DOMAIN || 'http://localhost:3000',
      apiBasePath: process.env.SUPERTOKENS_API_BASE_PATH || '/auth/api',
      appName: process.env.SUPERTOKENS_APP_NAME || 'Portfolio App',
      connectionUri:
        process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.com',
      apiKey: process.env.SUPERTOKENS_API_KEY || '',
    }),
  ],
  controllers: [UsersController, UsersViewController, UsersApiController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
