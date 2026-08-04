import { Test, TestingModule } from '@nestjs/testing';
import { SubjectTeachersService } from './subject-teachers.service';

describe('SubjectTeachersService', () => {
  let service: SubjectTeachersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubjectTeachersService],
    }).compile();

    service = module.get<SubjectTeachersService>(SubjectTeachersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
