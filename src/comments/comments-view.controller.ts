import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Render,
  Res,
  Req,
  ParseIntPipe,
  Delete,
  Redirect,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Response, Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithSession extends Request {
  session?: SessionContainer;
}

interface CommentCreateDto {
  text: string;
  projectId: string;
  returnTo?: string;
}

interface CommentUpdateDto {
  text: string;
  returnTo?: string;
}

@ApiExcludeController()
@Controller('comments')
export class CommentsViewController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('create')
  @Redirect()
  async createComment(
    @Body() commentData: CommentCreateDto,
    @Req() req: RequestWithSession,
  ) {
    if (!req.session) {
      return { url: '/auth/signin' };
    }

    try {
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user) {
        return { url: '/auth/signin' };
      }

      await this.commentsService.create({
        text: commentData.text,
        userId: user.id,
        projectId: parseInt(commentData.projectId, 10),
      });

      // Redirect back to the project page or community page
      if (commentData.returnTo === 'project') {
        return { url: `/projects/${commentData.projectId}` };
      } else {
        return { url: '/promise' };
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      return {
        url: `/projects/${commentData.projectId}?error=Failed to create comment`,
      };
    }
  }

  @Get('edit/:id')
  @Render('comments/edit')
  async editCommentForm(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithSession,
    @Res() res: Response,
  ) {
    if (!req.session) {
      return res.redirect('/auth/signin');
    }

    try {
      const comment = await this.commentsService.findOne(id);
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user || (user.id !== comment.userId && user.role !== 'ADMIN')) {
        return res.redirect('/promise');
      }

      const project = await this.prisma.project.findUnique({
        where: { id: comment.projectId },
      });

      return {
        title: 'Edit Comment',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        comment,
        project,
        errorMessage: null,
      };
    } catch (error) {
      console.error(`Error fetching comment ${id} for edit:`, error);
      return res.redirect('/promise');
    }
  }

  @Post('edit/:id')
  @Redirect()
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: CommentUpdateDto,
    @Req() req: RequestWithSession,
  ) {
    if (!req.session) {
      return { url: '/auth/signin' };
    }

    try {
      const comment = await this.commentsService.findOne(id);
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user || (user.id !== comment.userId && user.role !== 'ADMIN')) {
        return { url: '/promise' };
      }

      await this.commentsService.update(id, { text: updateData.text });

      if (updateData.returnTo === 'project') {
        return { url: `/projects/${comment.projectId}` };
      } else {
        return { url: '/promise' };
      }
    } catch (error) {
      console.error(`Error updating comment ${id}:`, error);
      return { url: '/promise?error=Failed to update comment' };
    }
  }

  @Delete(':id')
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithSession,
    @Res() res: Response,
  ) {
    if (!req.session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
      const comment = await this.commentsService.findOne(id);
      const userEmail = req.session.getUserId();
      const user = await this.prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (!user || (user.id !== comment.userId && user.role !== 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      await this.commentsService.remove(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Error deleting comment ${id}:`, error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}
