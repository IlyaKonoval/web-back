import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsApiController } from './comments-api.controller';
import { CommentsViewController } from './comments-view.controller';
import { CommentsResolver } from './comments.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsApiController, CommentsViewController],
  providers: [CommentsService, CommentsResolver],
  exports: [CommentsService],
})
export class CommentsModule {}