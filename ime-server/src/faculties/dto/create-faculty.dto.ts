import { IsString } from 'class-validator';

export class CreateFacultyDto {
  @IsString()
  name!: string;

  @IsString()
  shortName!: string;
}
