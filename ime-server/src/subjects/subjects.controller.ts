import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards } from '@nestjs/common';

import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}
    @Get('subjects')
  @UseGuards(JwtAuthGuard)
  getSubjects(
    @Req() req: any,
  ) {
    console.log(
      '[SUBJECTS HTTP USER]',
      req.user,
    );

    const userId =
      req.user?.id ??
      req.user?.sub;


    if (!userId) {
      throw new Error(
        'JWT userId отсутствует в req.user',
      );
    }


    return this.subjectsService.getSubjects(
      userId,
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
