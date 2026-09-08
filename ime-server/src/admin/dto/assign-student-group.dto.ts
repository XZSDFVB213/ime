import { IsNotEmpty, IsString } from 'class-validator';

export class AssignStudentGroupDto {
  @IsString()
  @IsNotEmpty()
  groupId!: string;
}
