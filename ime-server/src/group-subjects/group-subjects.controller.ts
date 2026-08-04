import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  // Param,
  // Delete,
} from '@nestjs/common';
import { GroupSubjectsService } from './group-subjects.service';
import { CreateGroupSubjectDto } from './dto/create-group-subject.dto';
// import { UpdateGroupSubjectDto } from './dto/update-group-subject.dto';

@Controller('group-subjects')
export class GroupSubjectsController {
  constructor(private readonly groupSubjectsService: GroupSubjectsService) {}

  @Post()
  create(@Body() createGroupSubjectDto: CreateGroupSubjectDto) {
    return this.groupSubjectsService.create(createGroupSubjectDto);
  }

  @Get()
  findAll() {
    return this.groupSubjectsService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.groupSubjectsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateGroupSubjectDto: UpdateGroupSubjectDto) {
  //   return this.groupSubjectsService.update(+id, updateGroupSubjectDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.groupSubjectsService.remove(+id);
  // }
}
