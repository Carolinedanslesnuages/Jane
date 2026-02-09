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
