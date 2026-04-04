export type Sex = 'MALE' | 'FEMALE';

export interface Animal {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: Sex | null;
  neutered: boolean;
  createdAt: string;
}

export interface AnimalInput {
  name: string;
  species?: Species;
  breed?: string;
  birthDate?: string;
  sex?: Sex;
  neutered?: boolean;
}

export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
}

export type BehaviorCategory = 'EXPLORATION' | 'PLAY' | 'REST' | 'SOCIAL' | 'STRESS' | 'ELIMINATION';

export interface EthogramCategory {
  category: BehaviorCategory;
  label: string;
  behaviors: string[];
  /** What to look for to record each behaviour. */
  definitions: Record<string, string>;
}

export interface Observation {
  id: string;
  animalId: string;
  behavior: string;
  category: BehaviorCategory;
  type: 'EVENT' | 'STATE';
  startedAt: string | null;
  recordedAt: string;
  durationSeconds: number | null;
  notes: string | null;
  location: string | null;
  weather: string | null;
  stimuli: string | null;
}

export interface ActiveState {
  /** True for a state started on this device that the server does not know yet. */
  pending?: boolean;
  id: string;
  animalId: string;
  behavior: string;
  category: BehaviorCategory;
  startedAt: string;
}

export interface ObservationContext {
  /** For an event noted after the fact: when it happened (ISO). */
  occurredAt?: string;
  notes?: string;
  location?: string;
  weather?: string;
  stimuli?: string;
}

export type CognitiveTestType = 'OBJECT_PERMANENCE' | 'DETOUR' | 'MANIPULATION';

export interface CognitiveTest {
  id: string;
  animalId: string;
  testType: CognitiveTestType;
  recordedAt: string;
  durationSeconds: number;
  score: number | null;
  notes: string | null;
}

export interface CognitiveTestInput {
  testType: CognitiveTestType;
  durationSeconds: number;
  score?: number;
  notes?: string;
}

export interface StatsSummary {
  totals: { observations: number; observedDays: number; measuredSeconds: number; stressCount: number };
  timeBudget: { category: BehaviorCategory; durationSeconds: number; eventCount: number }[];
  stress: {
    total: number;
    averagePerDay: number;
    byDay: { date: string; count: number }[];
    byBehavior: { label: string; count: number }[];
    byHour: { hour: number; count: number }[];
    byStimulus: { label: string; count: number }[];
    byLocation: { label: string; count: number }[];
  };
  timeline: { date: string; category: BehaviorCategory; count: number }[];
}

export type Species = 'DOG' | 'CAT' | 'HORSE' | 'OTHER';

export type SamplingMethod = 'AD_LIBITUM' | 'FOCAL' | 'SCAN';

export interface ObservationSession {
  id: string;
  animalId: string;
  observerName: string;
  method: SamplingMethod;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  observationCount: number;
}

export interface SessionInput {
  observerName?: string;
  method?: SamplingMethod;
  notes?: string;
}
