import { Test, TestingModule } from '@nestjs/testing';
import { GroupSubjectsService } from './group-subjects.service';

describe('GroupSubjectsService', () => {
  let service: GroupSubjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupSubjectsService],
    }).compile();

    service = module.get<GroupSubjectsService>(GroupSubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
