import { PartialType } from '@nestjs/swagger';
import { CreateGroupSubjectDto } from './create-group-subject.dto';

export class UpdateGroupSubjectDto extends PartialType(CreateGroupSubjectDto) {}
