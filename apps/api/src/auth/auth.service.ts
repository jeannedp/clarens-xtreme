import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from 'src/shared/providers/supabase-client.provider';
import { AuthDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient
  ){}

  public async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email, password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    } as AuthDto;
  }
}
