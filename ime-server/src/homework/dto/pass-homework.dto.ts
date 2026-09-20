import { IsString, MinLength } from 'class-validator';

export class PassHomeworkDto {
  @IsString()
  @MinLength(5)
  content!: string;
}
