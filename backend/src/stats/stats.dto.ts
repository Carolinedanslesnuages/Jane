import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class StatsQuery {
  @IsOptional()
  @IsUUID()
  animalId?: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  /** Fuseau horaire IANA (ex. Europe/Paris) servant à découper les jours. UTC par défaut. */
  @IsOptional()
  @IsString()
  timezone?: string;
}
