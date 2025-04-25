import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Render,
  Res,
  ParseIntPipe,
  NotFoundException,
  ConflictException,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response, Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiExcludeController()
@Controller('user-views')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersViewController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Render('users_view/index_user')
  async showUsers(@Req() req: Request) {
    try {
      const users = await this.usersService.findAll();
      return {
        users,
        title: 'Список пользователей',
        bodyClass: 'bg-gray-100',
        mainClass: 'p-4',
        currentUser: req.session ? req.session.getUserId() : null,
      };
    } catch (error) {
      console.error('Error fetching users_view for view:', error);
      return {
        users: [],
        title: 'Ошибка загрузки пользователей',
        errorMessage:
          'Не удалось загрузить список пользователей. Попробуйте позже.',
        bodyClass: 'bg-red-100',
        mainClass: 'p-4',
      };
    }
  }

  @Get('create')
  @Render('users_view/create')
  createForm() {
    return {
      title: 'Создание пользователя',
      bodyClass: 'bg-blue-100',
      mainClass: 'p-4',
      formData: {},
      errorMessage: null,
    };
  }

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    try {
      await this.usersService.create(createUserDto);
      res.redirect('/user-views');
    } catch (error) {
      console.error('Error creating user from view:', error);
      res.render('users_view/create', {
        title: 'Ошибка создания пользователя',
        errorMessage:
          error instanceof ConflictException ||
          error instanceof NotFoundException
            ? error.message
            : 'Произошла ошибка при создании. Проверьте данные и попробуйте снова.',
        bodyClass: 'bg-red-100',
        mainClass: 'p-4',
        formData: {
          username: createUserDto.username,
          email: createUserDto.email,
        },
      });
    }
  }

  @Get('edit/:id')
  @Render('users_view/edit')
  async editForm(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.usersService.findOne(id);
      return {
        user,
        title: 'Редактирование пользователя',
        bodyClass: 'bg-yellow-100',
        mainClass: 'p-4',
        errorMessage: null,
      };
    } catch (error) {
      console.error(`Error fetching user ${id} for edit view:`, error);
      return {
        title: 'Ошибка загрузки пользователя',
        errorMessage: `Не удалось загрузить пользователя с ID ${id}.`,
        bodyClass: 'bg-red-100',
        mainClass: 'p-4',
        user: null,
      };
    }
  }

  @Post('edit/:id')
  async edit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    if (
      updateUserDto.password !== undefined &&
      updateUserDto.password.trim() === ''
    ) {
      delete updateUserDto.password;
    }

    try {
      await this.usersService.update(id, updateUserDto);
      res.redirect('/user-views');
    } catch (error) {
      console.error(`Error updating user ${id} from view:`, error);

      let currentUserData = { id, ...updateUserDto };
      try {
        const userFromDb = await this.usersService.findOne(id);
        currentUserData = { ...userFromDb, ...updateUserDto };
      } catch (findError) {
        console.error(
          `Could not refetch user ${id} after update error`,
          findError,
        );
      }
      delete currentUserData.password;

      res.render('users_view/edit', {
        title: 'Ошибка редактирования',
        errorMessage:
          error instanceof ConflictException ||
          error instanceof NotFoundException
            ? error.message
            : 'Произошла ошибка при обновлении. Проверьте данные и попробуйте снова.',
        bodyClass: 'bg-red-100',
        mainClass: 'p-4',
        user: currentUserData,
      });
    }
  }

  @Post('delete/:id')
  async removeUserPost(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.usersService.remove(id);
      res.redirect('/user-views');
    } catch (error) {
      console.error(`Error deleting user ${id} from view:`, error);
      res.redirect(
        `/user-views?error=${encodeURIComponent('Не удалось удалить пользователя.')}`,
      );
    }
  }

  @Delete('delete/:id')
  async removeUser(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.usersService.remove(id);
      res.redirect('/user-views');
    } catch (error) {
      console.error(`Error deleting user ${id} from view:`, error);
      res.redirect(
        `/user-views?error=${encodeURIComponent('Не удалось удалить пользователя.')}`,
      );
    }
  }

  @Post('promote/:id')
  async promoteToAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      // Import AuthService and call promoteToAdmin
      const { AuthService } = await import('../auth/auth.service');
      const authService = res.app.get(AuthService);
      await authService.promoteToAdmin(id);

      res.redirect('/user-views');
    } catch (error) {
      console.error(`Error promoting user ${id} to admin:`, error);
      res.redirect(
        `/user-views?error=${encodeURIComponent('Не удалось сделать пользователя администратором.')}`,
      );
    }
  }
}