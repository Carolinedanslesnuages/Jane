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

  /** Moment où l'événement a eu lieu, pour une saisie après coup (maintenant par défaut, jamais dans le futur). */
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

export class LogStateDto extends ObservationContextDto {
  @IsString()
  @IsNotEmpty()
  behavior: string;

  /** Début de l'état, déjà terminé. */
  @IsDateString()
  startedAt: string;

  /** Fin de l'état : après le début, jamais dans le futur. */
  @IsDateString()
  endedAt: string;
}

export class StartStateDto {
  @IsString()
  @IsNotEmpty()
  behavior: string;

  /** Moment réel du démarrage, pour un état lancé sans réseau (maintenant par défaut, jamais dans le futur). */
  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

export class StopStateDto extends ObservationContextDto {
  @IsString()
  @IsNotEmpty()
  behavior: string;

  /** Moment réel de l'arrêt, pour un état arrêté sans réseau (maintenant par défaut, après le début, jamais dans le futur). */
  @IsOptional()
  @IsDateString()
  endedAt?: string;
}

export class ListObservationsQuery {
  @IsOptional()
  @IsUUID()
  animalId?: string;

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
