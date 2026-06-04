import {Service, Injectable, Signal, signal} from '@angular/core';
import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {environment} from '../../environments/environment';

export interface Guess
{
  id?: number;
  bettorName: string;
  teamA: string;
  teamB: string;
  goalsTeamA: number;
  goalsTeamB: number;
}

@Injectable({providedIn: 'root'})

@Service()
export class Supabase
{
  // lista reativa (Signal) para guardar as apostas que vierem da nuvem
  listOfGuesss = signal<Guess[]>([]);

  // conexão supabase
  private supabase: SupabaseClient =
    createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

  constructor()
  {
    // Sempre que o app abrir, ele já busca os palpites automaticamente
    this.findGuess();
  }

  // AÇÃO 1: Ir na nuvem e pegar todos os palpites salvos
  async findGuess()
  {
    const {data, error} = await this.supabase
      .from('guesses')
      .select('*')
      .order('id', {ascending: true});

    if (error)
    {
      console.error('Erro ao buscar dados do Supabase:', error.message);
    } else if (data)
    {
      // Guarda o resultado dentro da lista reativa
      this.listOfGuesss.set(data as Guess[]);
    }
  }

  // AÇÃO 2: Atualizar ou Inserir palpites que o Admin editou
  async saveGuessesAdmin(editedGuesses: Guess[])
  {

    // O Supabase é inteligente: o método 'upsert' salva se for novo ou atualiza se já existir
    const {error} = await this.supabase
      .from('guesses')
      .upsert(editedGuesses);

    if (error)
    {
      alert('Erro ao salvar no banco de dados: ' + error.message);
    } else
    {
      alert('Tudo salvo com sucesso no Supabase! 🎉');

      // Recarrega a lista para garantir que está atualizada
      this.findGuess();
    }
  }

}
