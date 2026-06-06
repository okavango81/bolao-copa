import {Component, inject, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Supabase} from '../../service/supabase';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-public-accsess',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-accsess.html',
  styleUrl: './public-accsess.scss',
})
export class PublicAccsess
{
  supabaseService = inject(Supabase);

  jogos = this.supabaseService.matches;
  jogoAtivo = this.supabaseService.activeMatch;
  palpites = this.supabaseService.guesses;
  // Calcula os ganhadores
  ganhadores = computed(() =>
  {
    const jogo = this.jogoAtivo();
    const listaPalpites = this.palpites();

    if (!jogo || jogo.goals_team_a === null || jogo.goals_team_b === null)
    {
      return [];
    }

    return listaPalpites.filter(p =>
      p.goals_team_a === jogo.goals_team_a &&
      p.goals_team_b === jogo.goals_team_b
    );
  });
  private intervalId: any;

  ngOnInit()
  {
    // Cria o loop de recarregamento automático (Ex: A cada 5 segundos)
    this.intervalId = setInterval(() =>
    {
      this.recarregarDadosSilenciosamente();
    }, 5000);
  }

  ngOnDestroy()
  {
    // Destrói o timer se o usuário sair da página para não pesar o navegador
    if (this.intervalId)
    {
      clearInterval(this.intervalId);
    }
  }

  async recarregarDadosSilenciosamente()
  {
    // 1. Pega o ID do jogo que o usuário está olhando ANTES da atualização
    const jogoAtualAntesDeAtualizar = this.jogoAtivo();

    // 2. Atualiza a lista global de jogos vinda do Supabase
    await this.supabaseService.loadMatches();

    // Se havia um jogo selecionado na tela...
    if (jogoAtualAntesDeAtualizar)
    {
      // 3. PROCURA esse mesmo jogo dentro da lista NOVA que acabou de vir do banco
      // Esse jogo novo já virá com os gols inseridos pelo Admin!
      const jogoComPlacarAtualizado = this.jogos().find(j => j.id === jogoAtualAntesDeAtualizar.id);

      if (jogoComPlacarAtualizado)
      {
        // 4. ATUALIZA o sinal do jogo ativo com a nova versão contendo o placar oficial
        this.supabaseService.setActiveMatch(jogoComPlacarAtualizado);
      }

      // 5. Atualiza os palpites daquele jogo normalmente
      await this.supabaseService.loadGuessesForMatch(jogoAtualAntesDeAtualizar.id);
    }
  }

  onJogoChange(event: Event)
  {
    const selectElement = event.target as HTMLSelectElement;
    const jogoId = Number(selectElement.value);
    const jogoSelecionado = this.jogos().find(j => j.id === jogoId);
    if (jogoSelecionado)
    {
      this.supabaseService.setActiveMatch(jogoSelecionado);
    }
  }

  abreviarTime(nome: string): string
  {
    return nome.substring(0, 3).toUpperCase();
  }

  premioTotal = computed(() => {
    const jogoAtual = this.supabaseService.activeMatch(); // O jogo selecionado na tela
    const palpites = this.supabaseService.guesses()// Lista de palpites filtrada por esse jogo

    if (!jogoAtual || !palpites) return 0;

    // Multiplica o valor individual cadastrado na partida pelo total de participantes
    return (jogoAtual.bet_value || 0) * palpites.length;
  });
}
