import { PartialType } from '@nestjs/mapped-types';
import { CreateAnimalDto } from './animal.dto';

export class UpdateAnimalDto extends PartialType(CreateAnimalDto) {}
