import { Controller, Get, Post, Body, Param, Delete, Req } from '@nestjs/common';

import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}
  @Get('subjects')
getSubjects(
  @Req() req: any,
) {
  console.log(
    '[SUBJECTS] req.user:',
    req.user,
  );

  return this.subjectsService.getSubjects(
    req.user.sub,
  );
}
  @Post()
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
