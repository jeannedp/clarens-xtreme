import { Permission } from "./permissions.model";

export type UserAction = 'view' | 'create' | 'user';
export type UserResource = 'admin' | 'user';

export interface UserContext {
  userId: string;
  permissions: Permission[];
}
