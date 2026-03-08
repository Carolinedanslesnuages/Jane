import { CognitiveTestType } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class RecordCognitiveTestDto {
  @IsEnum(CognitiveTestType)
  testType: CognitiveTestType;

  /** Durée mesurée, en secondes (strictement positive). */
  @IsNumber()
  @Min(0.1)
  @Max(86400)
  durationSeconds: number;

  /** Note de 0 à 10, facultative. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  score?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ListCognitiveTestsQuery {
  @IsOptional()
  @IsUUID()
  animalId?: string;

  @IsOptional()
  @IsEnum(CognitiveTestType)
  testType?: CognitiveTestType;
}

/** Correction d'un résultat : seuls les champs fournis changent ; `score: null` efface la note. */
export class UpdateCognitiveTestDto extends PartialType(RecordCognitiveTestDto) {}
