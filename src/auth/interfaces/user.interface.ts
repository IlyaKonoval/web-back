export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: Role;
  registrationDate?: Date;
  isGuest?: boolean;
}

export interface JwtPayload {
  email: string;
  sub: number;
  isGuest?: boolean;
  role?: Role;
}
