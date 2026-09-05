import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../providers/supabase-client.provider";

@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient
  ){}

  public async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    
    const token = authorization?.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException();
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException(error?.message ?? 'Invalid or expired token');
    }

    (request as any).user = data.user;
    return true;
  }
}
