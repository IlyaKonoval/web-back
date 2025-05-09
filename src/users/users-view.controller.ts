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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('user-views')
export class UsersViewController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Render('users_view/index_user')
  async showUsers() {
    try {
      const users = await this.usersService.findAll();

      return {
        users,
        title: 'Список пользователей',
        bodyClass: 'bg-gray-100',
        mainClass: 'p-4',
        currentUser: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Error fetching users for view:', errorMessage);
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
      const errorMessage =
        error instanceof ConflictException || error instanceof NotFoundException
          ? error.message
          : 'Произошла ошибка при создании. Проверьте данные и попробуйте снова.';

      console.error(
        'Error creating user from view:',
        error instanceof Error ? error.message : error,
      );

      res.render('users_view/create', {
        title: 'Ошибка создания пользователя',
        errorMessage,
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Не удалось загрузить пользователя с ID ${id}`;
      console.error(`Error fetching user ${id} for edit view:`, errorMessage);

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
      console.error(
        `Error updating user ${id} from view:`,
        error instanceof Error ? error.message : error,
      );

      let currentUserData = { id, ...updateUserDto };
      try {
        const userFromDb = await this.usersService.findOne(id);
        currentUserData = { ...userFromDb, ...updateUserDto };
      } catch (findError) {
        console.error(
          `Could not refetch user ${id} after update error`,
          findError instanceof Error ? findError.message : findError,
        );
      }
      delete currentUserData.password;

      const errorMessage =
        error instanceof ConflictException || error instanceof NotFoundException
          ? error.message
          : 'Произошла ошибка при обновлении. Проверьте данные и попробуйте снова.';

      res.render('users_view/edit', {
        title: 'Ошибка редактирования',
        errorMessage,
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
      console.error(
        `Error deleting user ${id} from view:`,
        error instanceof Error ? error.message : error,
      );
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
      console.error(
        `Error deleting user ${id} from view:`,
        error instanceof Error ? error.message : error,
      );
      res.redirect(
        `/user-views?error=${encodeURIComponent('Не удалось удалить пользователя.')}`,
      );
    }
  }
}
