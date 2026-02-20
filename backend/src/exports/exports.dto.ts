import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ExportQuery {
  @IsOptional()
  @IsUUID()
  dogId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
