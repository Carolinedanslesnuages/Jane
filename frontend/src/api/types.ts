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
