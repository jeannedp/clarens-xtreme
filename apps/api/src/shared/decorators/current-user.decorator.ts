import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import { UserContext } from "../models/user-context.model";

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const authUser = request.user;

    return {
      userId: authUser.id,
      permissions: ['view:users'], // authUser.user_metadata.user_role,
    } as UserContext;
  }
);
