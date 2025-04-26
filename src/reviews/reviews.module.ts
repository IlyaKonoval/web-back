import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsApiController } from './reviews-api.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsApiController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
