import { Test, TestingModule } from '@nestjs/testing';
import { SubjectTeachersController } from './subject-teachers.controller';
import { SubjectTeachersService } from './subject-teachers.service';

describe('SubjectTeachersController', () => {
  let controller: SubjectTeachersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectTeachersController],
      providers: [SubjectTeachersService],
    }).compile();

    controller = module.get<SubjectTeachersController>(SubjectTeachersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
