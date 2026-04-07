import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ObservationSession } from '@prisma/client';
import { AnimalsService } from '../animals/animals.service';
import { ObservationsService } from '../observations/observations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EndSessionDto, ListSessionsQuery, StartSessionDto } from './session.dto';

export type SessionWithCount = ObservationSession & { observationCount: number };

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animalsService: AnimalsService,
    private readonly observationsService: ObservationsService,
  ) {}

  /** Starts a session. An animal has at most one open session at a time. */
  async start(userId: string, animalId: string, input: StartSessionDto, defaultObserver: string): Promise<ObservationSession> {
    await this.animalsService.requireAccess(userId, animalId, 'OBSERVER');
    const open = await this.prisma.observationSession.findFirst({ where: { animalId, endedAt: null } });
    if (open) {
      throw new ConflictException('Une séance est déjà en cours pour cet animal');
    }
    return this.prisma.observationSession.create({
      data: {
        animalId,
        observerName: input.observerName?.trim() || defaultObserver,
        method: input.method ?? 'AD_LIBITUM',
        notes: input.notes,
      },
    });
  }

  /** Ends a session; the states still running are stopped at the same moment. */
  async end(userId: string, sessionId: string, input: EndSessionDto): Promise<ObservationSession> {
    const session = await this.findOwned(userId, sessionId);
    if (session.endedAt) {
      throw new ConflictException('Cette séance est déjà terminée');
    }
    const running = await this.prisma.activeState.findMany({ where: { animalId: session.animalId } });
    for (const state of running) {
      await this.observationsService.stopState(userId, session.animalId, { behavior: state.behavior });
    }
    return this.prisma.observationSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date(), ...(input.notes !== undefined ? { notes: input.notes } : {}) },
    });
  }

  async findOne(userId: string, sessionId: string): Promise<SessionWithCount> {
    const session = await this.prisma.observationSession.findFirst({
      where: { id: sessionId, animal: AnimalsService.accessibleBy(userId) },
      include: { _count: { select: { observations: true } } },
    });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }
    const { _count, ...rest } = session;
    return { ...rest, observationCount: _count.observations };
  }

  /** The sessions of the owner's animals, newest first, with their number of observations. */
  async list(userId: string, query: ListSessionsQuery): Promise<SessionWithCount[]> {
    const sessions = await this.prisma.observationSession.findMany({
      where: { animal: AnimalsService.accessibleBy(userId), ...(query.animalId ? { animalId: query.animalId } : {}) },
      include: { _count: { select: { observations: true } } },
      orderBy: { startedAt: 'desc' },
    });
    return sessions.map(({ _count, ...rest }) => ({ ...rest, observationCount: _count.observations }));
  }

  /** Deletes a session; its observations are kept, they just no longer belong to a session. */
  async remove(userId: string, sessionId: string): Promise<void> {
    await this.findOwned(userId, sessionId);
    await this.prisma.observationSession.delete({ where: { id: sessionId } });
  }

  /** The session, once the user is known to be allowed to record for its animal. */
  private async findOwned(userId: string, sessionId: string): Promise<ObservationSession> {
    const session = await this.prisma.observationSession.findFirst({
      where: { id: sessionId, animal: AnimalsService.accessibleBy(userId) },
    });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }
    await this.animalsService.requireAccess(userId, session.animalId, 'OBSERVER');
    return session;
  }
}
