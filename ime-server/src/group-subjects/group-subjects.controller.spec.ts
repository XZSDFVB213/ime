import { Test, TestingModule } from '@nestjs/testing';
import { GroupSubjectsController } from './group-subjects.controller';
import { GroupSubjectsService } from './group-subjects.service';

describe('GroupSubjectsController', () => {
  let controller: GroupSubjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupSubjectsController],
      providers: [GroupSubjectsService],
    }).compile();

    controller = module.get<GroupSubjectsController>(GroupSubjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
