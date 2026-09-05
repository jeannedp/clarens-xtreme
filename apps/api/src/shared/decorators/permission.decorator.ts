import { SetMetadata } from "@nestjs/common";
import { Permission } from "../models/permissions.model";

export const PERMISSION_KEY = 'permission';
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSION_KEY, permissions);
