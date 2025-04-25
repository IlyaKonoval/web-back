import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthViewController } from './auth-view.controller';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import UserRoles from 'supertokens-node/recipe/userroles';
import { PrismaModule } from '../../prisma/prisma.module';

export interface AuthModuleConfig {
  apiDomain: string;
  apiBasePath: string;
  appName: string;
  connectionUri: string;
  apiKey: string;
}

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, AuthViewController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {
  static forRoot(config: AuthModuleConfig): DynamicModule {
    supertokens.init({
      framework: 'express',
      supertokens: {
        connectionURI: config.connectionUri,
        apiKey: config.apiKey,
      },
      appInfo: {
        appName: config.appName,
        apiDomain: config.apiDomain,
        websiteDomain: config.apiDomain,
        apiBasePath: config.apiBasePath,
        websiteBasePath: '/auth',
      },
      recipeList: [EmailPassword.init(), Session.init(), UserRoles.init()],
    });

    return {
      module: AuthModule,
      providers: [
        {
          provide: 'AUTH_CONFIG',
          useValue: config,
        },
      ],
    };
  }
}
