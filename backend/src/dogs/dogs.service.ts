import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Dog, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDogDto } from './dog.dto';
import { UpdateDogDto } from './update-dog.dto';

@Injectable()
export class DogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string): Promise<Dog[]> {
    return this.prisma.dog.findMany({ where: { ownerId }, orderBy: { name: 'asc' } });
  }

  async create(ownerId: string, input: CreateDogDto): Promise<Dog> {
    try {
      return await this.prisma.dog.create({ data: { ownerId, ...this.toData(input) } as Prisma.DogUncheckedCreateInput });
    } catch (error) {
      throw this.translateError(error, input.name);
    }
  }

  async findOne(ownerId: string, dogId: string): Promise<Dog> {
    const dog = await this.prisma.dog.findFirst({ where: { id: dogId, ownerId } });
    if (!dog) {
      throw new NotFoundException('Chien introuvable');
    }
    return dog;
  }

  async update(ownerId: string, dogId: string, input: UpdateDogDto): Promise<Dog> {
    await this.findOne(ownerId, dogId);
    try {
      return await this.prisma.dog.update({ where: { id: dogId }, data: this.toData(input) });
    } catch (error) {
      throw this.translateError(error, input.name ?? '');
    }
  }

  /** Deletes the dog together with its observations, running states and tests. */
  async remove(ownerId: string, dogId: string): Promise<void> {
    await this.findOne(ownerId, dogId);
    await this.prisma.dog.delete({ where: { id: dogId } });
  }

  private toData(input: UpdateDogDto) {
    const { birthDate, ...rest } = input;
    return { ...rest, ...(birthDate !== undefined ? { birthDate: new Date(birthDate) } : {}) };
  }

  private translateError(error: unknown, name: string): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`Un chien nommé ${name} existe déjà`);
    }
    return error;
  }
}
