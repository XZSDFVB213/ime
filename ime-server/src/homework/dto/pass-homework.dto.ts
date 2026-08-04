import { IsString } from 'class-validator';

export class PassHomeworkDto {
  @IsString()
  answer!: string;
}
