export type DogSex = 'MALE' | 'FEMALE';

export interface Dog {
  id: string;
  name: string;
  breed: string | null;
  birthDate: string | null;
  sex: DogSex | null;
  neutered: boolean;
  createdAt: string;
}

export interface DogInput {
  name: string;
  breed?: string;
  birthDate?: string;
  sex?: DogSex;
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
}

export interface Observation {
  id: string;
  dogId: string;
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
  id: string;
  dogId: string;
  behavior: string;
  category: BehaviorCategory;
  startedAt: string;
}

export interface ObservationContext {
  notes?: string;
  location?: string;
  weather?: string;
  stimuli?: string;
}

export type CognitiveTestType = 'OBJECT_PERMANENCE' | 'DETOUR' | 'MANIPULATION';

export interface CognitiveTest {
  id: string;
  dogId: string;
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
