import { ShareRole } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class ShareAnimalDto {
  /** Adresse e-mail du compte Jane avec lequel partager. */
  @IsEmail()
  email: string;

  /** VIEWER : consulter seulement. OBSERVER : consulter et saisir. */
  @IsEnum(ShareRole)
  role: ShareRole;
}
