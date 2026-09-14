import { PartialType } from '@nestjs/swagger';
import { CreatePortfolioItemDto } from './create-portfolio.dto';

export class UpdatePortfolioDto extends PartialType(CreatePortfolioItemDto) {}
