import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return object with title and classes', () => {
      const result = appController.root();

      expect(result).toEqual({
        title: 'Personal Portfolio Website',
        bodyClass: 'index-body',
        mainClass: 'index-main',
      });
    });
  });

  describe('index', () => {
    it('should return object with title and classes', () => {
      const result = appController.index();

      expect(result).toEqual({
        title: 'Personal Portfolio Website',
        bodyClass: 'index-body',
        mainClass: 'index-main',
      });
    });
  });

  describe('portfolio', () => {
    it('should return object with title and classes', () => {
      const result = appController.portfolio();

      expect(result).toEqual({
        title: 'Portfolio',
        bodyClass: 'portfolio-body',
        mainClass: 'portfolio-main',
      });
    });
  });
});
