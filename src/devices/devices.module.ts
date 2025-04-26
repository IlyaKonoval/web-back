import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesApiController } from './devices-api.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DevicesApiController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}