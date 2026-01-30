import { DogSex } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  breed?: string;

  /** Date de naissance au format AAAA-MM-JJ. */
  @IsOptional()
  @IsDateString({ strict: true })
  birthDate?: string;

  @IsOptional()
  @IsEnum(DogSex)
  sex?: DogSex;

  @IsOptional()
  @IsBoolean()
  neutered?: boolean;
}
