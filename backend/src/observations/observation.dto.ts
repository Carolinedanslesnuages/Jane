import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/** Contexte facultatif d'une observation. */
export class ObservationContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  weather?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  stimuli?: string;
}

export class RecordEventDto extends ObservationContextDto {
  @IsString()
  @IsNotEmpty()
  behavior: string;
}

export class StartStateDto {
  @IsString()
  @IsNotEmpty()
  behavior: string;
}

export class StopStateDto extends ObservationContextDto {
  @IsString()
  @IsNotEmpty()
  behavior: string;
}

export class ListObservationsQuery {
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
