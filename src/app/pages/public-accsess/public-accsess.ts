// import {Component, OnInit, OnDestroy, inject} from '@angular/core';
// import {CommonModule} from '@angular/common';
// import {Supabase} from '../../service/supabase' ; // Ajusta o caminho
//
// @Component({
//   selector: 'app-public-accsess',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './public-accsess.html',
//   styleUrl: './public-accsess.scss',
// })
// export class PublicAccsess implements OnInit, OnDestroy
// {
//   private supabaseService = inject(Supabase);
//
//   // Link direto para o Signal do serviço
//   public listaDePalpites = this.supabaseService.listOfGuesss;
//
//   // Guardamos a referência do temporizador para o conseguir desligar depois
//   private pollingInterval: any;
//
//   async ngOnInit()
//   {
//     // 1. Faz a primeira busca imediatamente ao carregar a página
//     await this.supabaseService.findGuess();
//
//     // 2. Cria um loop automático que roda a cada 3 segundos (3000 milissegundos)
//     // Ele vai ao banco de dados em segundo plano, atualiza o Signal e o HTML muda sozinho!
//     this.pollingInterval = setInterval(async () =>
//     {
//       try
//       {
//         await this.supabaseService.findGuess();
//         console.log('Lista pública atualizada via Polling automática!');
//       } catch (error)
//       {
//         console.error('Erro no polling ao buscar palpites:', error);
//       }
//     }, 5000); // Se quiseres mais rápido, podes mudar para 2000 (2 segundos)
//   }
//
//   ngOnDestroy()
//   {
//     // 3. Muito importante: destrói o loop se o utilizador sair da página pública
//     if (this.pollingInterval)
//     {
//       clearInterval(this.pollingInterval);
//     }
//   }
// }
import {Component, inject, computed, signal} from '@angular/core';
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
}
