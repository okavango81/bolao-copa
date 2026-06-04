import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth
{
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  async login(password: string): Promise<boolean>
  {
    const { error } =
      await this.supabase.auth.signInWithPassword({
        email: "eguilhermeleitedev81@gmail.com",
        password
      });

    return !error;
  }

  async logout(): Promise<void>
  {
    await this.supabase.auth.signOut();
  }

  async isAuthenticated(): Promise<boolean>
  {
    const { data } =
      await this.supabase.auth.getSession();

    return !!data.session;
  }
}
