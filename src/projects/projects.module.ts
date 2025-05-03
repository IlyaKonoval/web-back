import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectResolver } from './project.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectResolver],
  exports: [ProjectsService],
})
export class ProjectsModule {}
