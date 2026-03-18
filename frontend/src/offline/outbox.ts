export interface OutboxEntry {
  id: string;
  /** The account the entry belongs to: an entry is never sent under another account. */
  userId: string;
  /** What to show the user, e.g. "Aboyer (Rex)". */
  label: string;
  path: string;
  body: unknown;
  /** When the observer made the entry, so the data keeps its real time. */
  createdAt: string;
}

export interface FlushResult {
  sent: number;
  /** Entries the server refused (they are removed, since sending them again would fail again). */
  rejected: { entry: OutboxEntry; message: string }[];
  /** True when the flush stopped because the network is down: the rest is kept. */
  interrupted: boolean;
}

/** Thrown by the sender when the request could not reach the server (as opposed to being refused). */
export class NetworkError extends Error {}

/** A refusal by the server for one entry, with its message. */
export class RejectedError extends Error {}

const STORAGE_KEY = 'jane.outbox';

/** An ordered list of requests waiting to be sent, kept in the browser storage. */
export class Outbox {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'>) {}

  private readAll(): OutboxEntry[] {
    try {
      return JSON.parse(this.storage.getItem(STORAGE_KEY) ?? '[]') as OutboxEntry[];
    } catch {
      return [];
    }
  }

  private writeAll(entries: OutboxEntry[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  /** The entries of one account, oldest first. */
  list(userId: string): OutboxEntry[] {
    return this.readAll().filter((entry) => entry.userId === userId);
  }

  add(entry: Omit<OutboxEntry, 'id' | 'createdAt'> & { createdAt?: string }): OutboxEntry {
    const complete: OutboxEntry = {
      ...entry,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    };
    this.writeAll([...this.readAll(), complete]);
    return complete;
  }

  private remove(entryId: string): void {
    this.writeAll(this.readAll().filter((entry) => entry.id !== entryId));
  }

  /**
   * Sends the entries of an account in order. A network failure stops the flush and keeps the rest;
   * a refusal removes the entry and carries on, so one bad entry cannot block the others.
   */
  async flush(userId: string, send: (entry: OutboxEntry) => Promise<void>): Promise<FlushResult> {
    const result: FlushResult = { sent: 0, rejected: [], interrupted: false };
    for (const entry of this.list(userId)) {
      try {
        await send(entry);
        this.remove(entry.id);
        result.sent += 1;
      } catch (error) {
        if (error instanceof NetworkError) {
          result.interrupted = true;
          return result;
        }
        this.remove(entry.id);
        result.rejected.push({ entry, message: (error as Error).message });
      }
    }
    return result;
  }
}
