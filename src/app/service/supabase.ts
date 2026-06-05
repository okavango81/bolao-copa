import {Injectable, signal} from '@angular/core';
import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {environment} from '../../environments/environment';

export interface Match
{
  id: number;
  team_a: string;
  team_b: string;
  goals_team_a: number | null;
  goals_team_b: number | null;
  created_at?: string;
}

export interface Guess
{
  id?: number;
  match_id: number;
  bettor_name: string;
  goals_team_a: number;
  goals_team_b: number;
  created_at?: string;
}

@Injectable({providedIn: 'root'})
export class Supabase
{
  // Signals para gerenciar o estado globalmente
  matches = signal<Match[]>([]);
  activeMatch = signal<Match | null>(null);
  guesses = signal<Guess[]>([]);
  private supabase: SupabaseClient;

  constructor()
  {
    this.supabase = createClient(
      'https://xmbstkxuisgscaxkypbs.supabase.co', // <-- Substitua pelo seu Project URL real
      'sb_publishable_FfUdzax2m1Z2Dlxp8NrioA_sn2JmakQ' // <-- Substitua pela sua API anon key real
    );
    this.loadMatches();
  }

  // --- MÉTODOS DE JOGOS ---

  // Carrega todos os jogos cadastrados
  async loadMatches()
  {
    const {data, error} = await this.supabase
      .from('matches')
      .select('*')
      .order('created_at', {ascending: false}); // O mais recente primeiro

    if (!error && data)
    {
      this.matches.set(data);
      // Se houver jogos e nenhum estiver ativo ainda, define o último como padrão
      if (data.length > 0 && !this.activeMatch())
      {
        this.setActiveMatch(data[0]);
      }
    }
  }

  // Define qual jogo está sendo visualizado na tela e carrega os palpites dele
  setActiveMatch(match: Match)
  {
    this.activeMatch.set(match);
    this.loadGuessesForMatch(match.id);
  }

  // Cadastra um novo jogo (Admin)
  async createMatch(teamA: string, teamB: string)
  {
    const {error} = await this.supabase
      .from('matches')
      .insert([{team_a: teamA, team_b: teamB}]);

    if (!error)
    {
      await this.loadMatches(); // Atualiza a lista de jogos
    }
  }

  // Atualiza o placar final do jogo (Admin)
  async updateMatchScore(matchId: number, goalsA: number, goalsB: number)
  {
    const {error} = await this.supabase
      .from('matches')
      .update({goals_team_a: goalsA, goals_team_b: goalsB})
      .eq('id', matchId);

    if (!error)
    {
      await this.loadMatches();
      // Atualiza o jogo ativo se for o caso
      const currentActive = this.activeMatch();
      if (currentActive && currentActive.id === matchId)
      {
        this.activeMatch.update(m => m ? {...m, goals_team_a: goalsA, goals_team_b: goalsB} : null);
      }
    }
  }

  // --- MÉTODOS DE PALPITES ---

  // Busca palpites filtrados pelo ID do jogo ativo
  async loadGuessesForMatch(matchId: number)
  {
    const {data, error} = await this.supabase
      .from('guesses')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', {ascending: true});

    if (!error && data)
    {
      this.guesses.set(data);
    }
  }

  // Envia um palpite atrelado ao jogo ativo
  // Envia um palpite atrelado a um jogo específico escolhido pelo Admin
  async saveGuess(matchId: number, bettorName: string, goalsA: number, goalsB: number)
  {
    const {error} = await this.supabase
      .from('guesses')
      .insert([{
        match_id: matchId,
        bettor_name: bettorName,
        goals_team_a: goalsA,
        goals_team_b: goalsB
      }]);

    if (!error)
    {
      // Se o palpite for do jogo que está aberto na tela atual, recarrega a lista
      const currentActive = this.activeMatch();
      if (currentActive && currentActive.id === matchId)
      {
        await this.loadGuessesForMatch(matchId);
      }
    }
  }

  // No seu serviço, mude o estado de autenticado para falso
  logout()
  {
    // Se você usa uma chave no localStorage ou um Signal de login:
    localStorage.removeItem('isAdminAuthenticated'); // ou o método que você usa para guardar a sessão
  }
}
