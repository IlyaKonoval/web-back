import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsApiController } from './reviews-api.controller';
import { ReviewResolver } from './review.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsApiController],
  providers: [ReviewsService, ReviewResolver],
  exports: [ReviewsService],
})
export class ReviewsModule {}