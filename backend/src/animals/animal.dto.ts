import { Sex, Species } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnimalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  /** Espèce de l'animal (chien par défaut) : elle détermine l'éthogramme. */
  @IsOptional()
  @IsEnum(Species)
  species?: Species;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  breed?: string;

  /** Date de naissance au format AAAA-MM-JJ. */
  @IsOptional()
  @IsDateString({ strict: true })
  birthDate?: string;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsBoolean()
  neutered?: boolean;
}
