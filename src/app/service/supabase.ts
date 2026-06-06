import {Injectable, signal} from '@angular/core';
import {createClient, SupabaseClient} from '@supabase/supabase-js';

export interface Match
{
  id: number;
  team_a: string;
  team_b: string;
  goals_team_a: number | null;
  goals_team_b: number | null;
  created_at?: string;
  bet_value: number | null;
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
  matches = signal<Match[]>([]);
  activeMatch = signal<Match | null>(null);
  guesses = signal<Guess[]>([]);
  private supabase: SupabaseClient;

  constructor()
  {
    this.supabase = createClient(
      'https://xmbstkxuisgscaxkypbs.supabase.co',
      'sb_publishable_FfUdzax2m1Z2Dlxp8NrioA_sn2JmakQ'
    );
    this.loadMatches();
  }

  async loadMatches()
  {
    const {data, error} = await this.supabase
      .from('matches')
      .select('*')
      .order('created_at', {ascending: false});

    if (!error && data)
    {
      this.matches.set(data);
      // Mantém ou redefine a partida ativa de fundo
      const currentActive = this.activeMatch();
      if (currentActive)
      {
        const aindaExiste = data.find(m => m.id === currentActive.id);
        if (!aindaExiste && data.length > 0) this.setActiveMatch(data[0]);
        else if (!aindaExiste) this.activeMatch.set(null);
      } else if (data.length > 0)
      {
        this.setActiveMatch(data[0]);
      }
    }
  }

  setActiveMatch(match: Match)
  {
    this.activeMatch.set(match);
    this.loadGuessesForMatch(match.id);
  }

  async createMatch(teamA: string, teamB: string, betValue: number)
  {
    const {error} = await this.supabase
      .from('matches')
      .insert([{team_a: teamA, team_b: teamB, bet_value: betValue}]);

    if (!error)
    {
      await this.loadMatches();
    }
  }

  async updateMatchScore(matchId: number, goalsA: number, goalsB: number)
  {
    const {error} = await this.supabase
      .from('matches')
      .update({goals_team_a: goalsA, goals_team_b: goalsB})
      .eq('id', matchId);

    if (!error)
    {
      await this.loadMatches();
      const currentActive = this.activeMatch();
      if (currentActive && currentActive.id === matchId)
      {
        this.activeMatch.update(m => m ? {...m, goals_team_a: goalsA, goals_team_b: goalsB} : null);
      }
    }
  }

  async updateBetValue(matchId: number, valueBet: number) {
    // 1. Garante que o valor recebido seja tratado estritamente como um número legítimo
    const numericValue = Number(valueBet);

    const { error } = await this.supabase
      .from('matches')
      .update({ bet_value: numericValue })
      .eq('id', matchId);

    // 2. Registra o erro no console caso o Supabase falhe ou recuse a query
    if (error) {
      console.error('Erro ao atualizar o bet_value no Supabase:', error);
      return; // Interrompe o fluxo para não atualizar o estado local com dados incorretos
    }

    // 3. Se tudo deu certo no banco, atualiza os estados reativos locais
    await this.loadMatches();

    const currentActive = this.activeMatch();
    if (currentActive && currentActive.id === matchId) {
      this.activeMatch.update(m => m ? { ...m, bet_value: numericValue } : null);
    }
  }

  async deleteMatch(matchId: number)
  {
    try
    {
      const {error} = await this.supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error)
      {
        console.error('Erro ao deletar partida:', error.message);
        alert('Erro ao apagar partida no banco. Verifique se existem restrições de chave estrangeira.');
        return false;
      }

      // CORREÇÃO: Força o recarregamento total da lista vinda do Supabase
      this.loadMatches();
      return true;
    } catch (err)
    {
      console.error('Erro inesperado ao deletar partida:', err);
      return false;
    }
  }

  // --- MÉTODOS DE PALPITES ---

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

  async getGuessesByMatch(matchId: number)
  {
    try
    {
      const {data, error} = await this.supabase
        .from('guesses')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', {ascending: true});

      if (error)
      {
        console.error('Erro ao buscar palpites:', error.message);
        return [];
      }
      return data || [];
    } catch (err)
    {
      console.error('Erro inesperado:', err);
      return [];
    }
  }

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
      const currentActive = this.activeMatch();
      if (currentActive && currentActive.id === matchId)
      {
        await this.loadGuessesForMatch(matchId);
      }
    }
  }

  async updateGuess(guessId: number, goalsA: number, goalsB: number, matchId: number)
  {
    try
    {
      // CORREÇÃO: Mapeia explicitamente para os nomes exatos das colunas da tabela de palpites
      const {error} = await this.supabase
        .from('guesses')
        .update({goals_team_a: goalsA, goals_team_b: goalsB})
        .eq('id', guessId);

      if (error)
      {
        console.error('Erro ao atualizar palpite:', error.message);
        alert('Erro ao salvar alteração do palpite.');
        return false;
      }

      const currentActive = this.activeMatch();
      if (currentActive && currentActive.id === matchId)
      {
        await this.loadGuessesForMatch(matchId);
      }
      return true;
    } catch (err)
    {
      console.error('Erro inesperado ao atualizar palpite:', err);
      return false;
    }
  }

  async deleteGuess(guessId: number)
  {
    try
    {
      const {error} = await this.supabase
        .from('guesses')
        .delete()
        .eq('id', guessId);

      if (error)
      {
        console.error('Erro ao deletar palpite:', error.message);
        alert('Não foi possível deletar o palpite no banco de dados.');
        return false;
      }
      return true;
    } catch (err)
    {
      console.error('Erro inesperado ao deletar palpite:', err);
      return false;
    }
  }

  logout()
  {
    localStorage.removeItem('isAdminAuthenticated');
  }
}
