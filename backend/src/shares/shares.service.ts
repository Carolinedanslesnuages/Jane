import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ShareRole } from '@prisma/client';
import { AnimalsService } from '../animals/animals.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShareAnimalDto } from './share.dto';

export interface ShareView {
  id: string;
  role: ShareRole;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
}

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animalsService: AnimalsService,
  ) {}

  /** Shares an animal with another account, or changes the role of an existing share. Owner only. */
  async share(ownerId: string, animalId: string, input: ShareAnimalDto): Promise<ShareView> {
    await this.animalsService.requireAccess(ownerId, animalId, 'OWNER');
    const target = await this.prisma.user.findFirst({ where: { email: { equals: input.email.trim(), mode: 'insensitive' } } });
    if (!target) {
      throw new NotFoundException("Aucun compte Jane n'a cette adresse : la personne doit s'être connectée une fois à Jane");
    }
    if (target.id === ownerId) {
      throw new BadRequestException('Cet animal est déjà le vôtre');
    }
    const share = await this.prisma.animalShare.upsert({
      where: { animalId_userId: { animalId, userId: target.id } },
      create: { animalId, userId: target.id, role: input.role },
      update: { role: input.role },
      include: { user: { select: { email: true, displayName: true } } },
    });
    return this.toView(share);
  }

  /** Who an animal is shared with. Owner only. */
  async list(ownerId: string, animalId: string): Promise<ShareView[]> {
    await this.animalsService.requireAccess(ownerId, animalId, 'OWNER');
    const shares = await this.prisma.animalShare.findMany({
      where: { animalId },
      include: { user: { select: { email: true, displayName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return shares.map((share) => this.toView(share));
  }

  /** Stops a share: the owner can withdraw anyone, and a person can leave an animal shared with them. */
  async remove(userId: string, animalId: string, shareId: string): Promise<void> {
    await this.animalsService.requireAccess(userId, animalId, 'VIEWER');
    const share = await this.prisma.animalShare.findFirst({ where: { id: shareId, animalId }, include: { animal: true } });
    if (!share || (share.animal.ownerId !== userId && share.userId !== userId)) {
      throw new NotFoundException('Partage introuvable');
    }
    await this.prisma.animalShare.delete({ where: { id: shareId } });
  }

  private toView(share: { id: string; role: ShareRole; createdAt: Date; user: { email: string | null; displayName: string | null } }): ShareView {
    return { id: share.id, role: share.role, createdAt: share.createdAt, email: share.user.email, displayName: share.user.displayName };
  }
}
