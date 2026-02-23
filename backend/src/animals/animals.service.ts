import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Animal, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnimalDto } from './animal.dto';
import { UpdateAnimalDto } from './update-animal.dto';

@Injectable()
export class AnimalsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string): Promise<Animal[]> {
    return this.prisma.animal.findMany({ where: { ownerId }, orderBy: { name: 'asc' } });
  }

  async create(ownerId: string, input: CreateAnimalDto): Promise<Animal> {
    try {
      return await this.prisma.animal.create({ data: { ownerId, ...this.toData(input) } as Prisma.AnimalUncheckedCreateInput });
    } catch (error) {
      throw this.translateError(error, input.name);
    }
  }

  async findOne(ownerId: string, animalId: string): Promise<Animal> {
    const animal = await this.prisma.animal.findFirst({ where: { id: animalId, ownerId } });
    if (!animal) {
      throw new NotFoundException('Animal introuvable');
    }
    return animal;
  }

  async update(ownerId: string, animalId: string, input: UpdateAnimalDto): Promise<Animal> {
    await this.findOne(ownerId, animalId);
    try {
      return await this.prisma.animal.update({ where: { id: animalId }, data: this.toData(input) });
    } catch (error) {
      throw this.translateError(error, input.name ?? '');
    }
  }

  /** Deletes the animal together with its observations, running states and tests. */
  async remove(ownerId: string, animalId: string): Promise<void> {
    await this.findOne(ownerId, animalId);
    await this.prisma.animal.delete({ where: { id: animalId } });
  }

  private toData(input: UpdateAnimalDto) {
    const { birthDate, ...rest } = input;
    return { ...rest, ...(birthDate !== undefined ? { birthDate: new Date(birthDate) } : {}) };
  }

  private translateError(error: unknown, name: string): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`Un animal nommé ${name} existe déjà`);
    }
    return error;
  }
}
