import { SamplingMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class StartSessionDto {
  /** Nom de l'observateur ; celui du compte par défaut. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  observerName?: string;

  /** Méthode d'échantillonnage : libre (ad libitum), focal ou scan. */
  @IsOptional()
  @IsEnum(SamplingMethod)
  method?: SamplingMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class EndSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ListSessionsQuery {
  @IsOptional()
  @IsUUID()
  animalId?: string;
}

