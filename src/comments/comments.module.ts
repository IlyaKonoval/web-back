import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsApiController } from './comments-api.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsApiController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
