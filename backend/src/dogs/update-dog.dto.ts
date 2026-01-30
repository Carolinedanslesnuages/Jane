import { PartialType } from '@nestjs/mapped-types';
import { CreateDogDto } from './dog.dto';

export class UpdateDogDto extends PartialType(CreateDogDto) {}
