import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Animal, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnimalDto, ListAnimalsQuery } from './animal.dto';
import { UpdateAnimalDto } from './update-animal.dto';

/** What a user may do with an animal: the owner can do everything, an observer can record, a viewer can only read. */
export type AccessRole = 'VIEWER' | 'OBSERVER' | 'OWNER';

const ROLE_RANK: Record<AccessRole, number> = { VIEWER: 1, OBSERVER: 2, OWNER: 3 };

export type AnimalWithAccess = Animal & {
  role: AccessRole;
  /** Who shared the animal; empty for the owner's own animals. */
  ownerName: string | null;
  /** The share the user holds on the animal (to leave it); empty for the owner's own animals. */
  shareId: string | null;
};

@Injectable()
export class AnimalsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Filter selecting the animals a user can see: their own and those shared with them. */
  static accessibleBy(userId: string): Prisma.AnimalWhereInput {
    return { OR: [{ ownerId: userId }, { shares: { some: { userId } } }] };
  }

  /**
   * The animal, if the user has at least the given role on it.
   * An animal the user cannot see at all is reported as missing; an animal they can see but not act on, as forbidden.
   */
  async requireAccess(userId: string, animalId: string, minimum: AccessRole): Promise<Animal & { role: AccessRole }> {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, ...AnimalsService.accessibleBy(userId) },
      include: { shares: { where: { userId } } },
    });
    if (!animal) {
      throw new NotFoundException('Animal introuvable');
    }
    const { shares, ...rest } = animal;
    const role: AccessRole = animal.ownerId === userId ? 'OWNER' : (shares[0]?.role ?? 'VIEWER');
    if (ROLE_RANK[role] < ROLE_RANK[minimum]) {
      throw new ForbiddenException(
        minimum === 'OWNER' ? 'Seul le propriétaire peut faire cela' : "Vous n'avez pas le droit de saisir pour cet animal",
      );
    }
    return { ...rest, role };
  }

  /** The animals of a user, their own and those shared with them, with the role they hold on each. */
  async listAccessible(userId: string, query: ListAnimalsQuery = {}): Promise<AnimalWithAccess[]> {
    const animals = await this.prisma.animal.findMany({
      where: { ...AnimalsService.accessibleBy(userId), ...(query.species ? { species: query.species } : {}) },
      include: { shares: { where: { userId } }, owner: { select: { displayName: true, email: true } } },
      orderBy: { name: 'asc' },
    });
    return animals.map(({ shares, owner, ...animal }) => {
      const isOwner = animal.ownerId === userId;
      return {
        ...animal,
        role: isOwner ? 'OWNER' : (shares[0]?.role ?? 'VIEWER'),
        ownerName: isOwner ? null : (owner.displayName ?? owner.email),
        shareId: isOwner ? null : (shares[0]?.id ?? null),
      };
    });
  }

  list(ownerId: string, query: ListAnimalsQuery = {}): Promise<Animal[]> {
    return this.prisma.animal.findMany({
      where: { ownerId, ...(query.species ? { species: query.species } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async create(ownerId: string, input: CreateAnimalDto): Promise<Animal> {
    try {
      return await this.prisma.animal.create({ data: { ownerId, ...this.toData(input) } as Prisma.AnimalUncheckedCreateInput });
    } catch (error) {
      throw this.translateError(error, input.name);
    }
  }

  /** The animal, for its owner only (see requireAccess for shared access). */
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
