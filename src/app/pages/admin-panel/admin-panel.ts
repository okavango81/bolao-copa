import {Component, inject, signal, ChangeDetectorRef, ViewChild, ElementRef,} from '@angular/core';
import {Router} from '@angular/router';
import {Supabase} from '../../service/supabase';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel
{
  supabaseService = inject(Supabase);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  @ViewChild('nomeDoApostador') inputNomeApostador!: ElementRef<HTMLInputElement>;

  jogos = this.supabaseService.matches;

  // Controle do Modal Único
  exibirModal = false;
  modoModal: 'cadastro-jogo' | 'editar-placar' | 'novo-palpite' | 'ver-apostadores' = 'cadastro-jogo';
  jogoSelecionadoId: number | null = null;
  tituloModal = '';

  // Lista local para os palpites exibidos dentro do modal
  palpitesDoJogo = signal<any[]>([]);

  // Controle de edição individual de apostador na tabela do modal
  apostadorEmEdicaoId: number | null = null;
  golsApostadorEdicaoA = 0;
  golsApostadorEdicaoB = 0;

  // Campos dos Formulários Gerais
  novoTimeA = '';
  novoTimeB = '';
  valorAposta = 5.00;
  golsEdicaoA = 0;
  golsEdicaoB = 0;
  valorEdicao = 0;
  nomeApostador = '';
  golsApostadorA = 0;
  golsApostadorB = 0;
  confrontoModal = '';

  async abrirModal(modo: 'cadastro-jogo' | 'editar-placar' | 'novo-palpite' | 'ver-apostadores', jogo?: any)
  {
    this.modoModal = modo;
    this.exibirModal = true;
    this.apostadorEmEdicaoId = null;

    if (jogo)
    {
      this.jogoSelecionadoId = jogo.id;
      this.valorAposta = jogo.bet_value || 5.00;
    }

    if (modo === 'cadastro-jogo')
    {
      this.tituloModal = 'Cadastrar Partida 🚀';
      this.confrontoModal = ``;
      this.novoTimeA = '';
      this.novoTimeB = '';
    } else if (modo === 'editar-placar' && jogo)
    {
      this.tituloModal = `Editar Partida`;
      this.confrontoModal = `${jogo.team_a} x ${jogo.team_b}`;
      this.golsEdicaoA = jogo.goals_team_a ?? 0;
      this.golsEdicaoB = jogo.goals_team_b ?? 0;
    } else if (modo === 'novo-palpite' && jogo)
    {
      this.tituloModal = `Cadastrar Palpite`;
      this.confrontoModal = `${jogo.team_a} x ${jogo.team_b}`;
      this.nomeApostador = '';
      this.golsApostadorA = 0;
      this.golsApostadorB = 0;

      setTimeout(() => {
        this.inputNomeApostador?.nativeElement.focus();
      }, 100);

    } else if (modo === 'ver-apostadores' && jogo)
    {
      this.tituloModal = `Apostadores`;
      this.confrontoModal = `${jogo.team_a} x ${jogo.team_b}`;
      await this.carregarPalpitesDoJogo(jogo.id);
    }
  }

  fecharModal()
  {
    this.exibirModal = false;
    this.jogoSelecionadoId = null;
    this.apostadorEmEdicaoId = null;
    this.palpitesDoJogo.set([]);
  }

  async carregarPalpitesDoJogo(matchId: number)
  {
    try
    {
      const dados = await this.supabaseService.getGuessesByMatch(matchId);
      if (dados)
      {
        this.palpitesDoJogo.set(dados);
      }
    } catch (err)
    {
      console.error('Erro ao carregar palpites:', err);
    }
  }

  async cadastrarJogo()
  {
    if (!this.novoTimeA.trim() || !this.novoTimeB.trim()) return;
    await this.supabaseService.createMatch(this.novoTimeA, this.novoTimeB, this.valorAposta);
    this.fecharModal();
  }

  async salvarPlacarOficial()
  {
    if (this.jogoSelecionadoId !== null)
    {
      await this.supabaseService.updateMatchScore(this.jogoSelecionadoId, this.golsEdicaoA, this.golsEdicaoB);
      this.novoTimeA = '';
      this.novoTimeB = '';
      this.fecharModal();
      alert('Placar oficial atualizado!');
    }
  }

  async salvarValorAposta()
  {
    if (this.jogoSelecionadoId !== null)
    {
      // 1. Forçamos a conversão para garantir que vá um número real ao serviço
      const valorNumerico = Number(this.valorEdicao);

      await this.supabaseService.updateBetValue(this.jogoSelecionadoId, valorNumerico);

      // 2. Fechamos o modal primeiro
      this.fecharModal();

      // 3. Reseta a variável local do input para o padrão (opcional, evita bug visual no próximo modal)
      this.valorAposta = 5.00;

      alert('Valor da aposta atualizado com sucesso! 🚀');
    }
  }

  async adicionarPalpiteAmigo()
  {
    this.inputNomeApostador?.nativeElement.focus();
    if (!this.nomeApostador.trim() || this.jogoSelecionadoId === null)
    {
      alert('Digite o nome do apostador!');
      return;
    }
    await this.supabaseService.saveGuess(this.jogoSelecionadoId, this.nomeApostador, this.golsApostadorA, this.golsApostadorB);

    alert('Palpite adicionado com sucesso!');

    this.fecharModal();

    this.cdr.detectChanges();
  }

  async excluirJogo(matchId: number, confronto: string)
  {
    if (confirm(`Tem certeza que deseja apagar o jogo "${confronto}"? Isso excluirá TODOS os palpites vinculados!`))
    {
      // 1. Guarda uma cópia de segurança caso o banco falhe
      const jogosAntigos = this.supabaseService.matches();

      // 2. SOME DA TELA IMEDIATAMENTE (O usuário sente o clique instantâneo)
      this.supabaseService.matches.update(jogos => jogos.filter(j => j.id !== matchId));

      // 3. Executa no banco em paralelo
      const sucesso = await this.supabaseService.deleteMatch(matchId);

      if (!sucesso)
      {
        // Se deu erro no Supabase (ex: erro de chave estrangeira), desfaz a alteração na tela
        this.supabaseService.matches.set(jogosAntigos);
      }
    }
  }

  iniciarEdicaoApostador(palpite: any)
  {
    this.apostadorEmEdicaoId = palpite.id;
    this.golsApostadorEdicaoA = palpite.goals_team_a;
    this.golsApostadorEdicaoB = palpite.goals_team_b;
  }

  cancelarEdicaoApostador()
  {
    this.apostadorEmEdicaoId = null;
  }

  // BLINDADO: Força a atualização local imediata na interface da tabela do modal
  async salvarEdicaoApostador(guessId: number)
  {
    if (this.jogoSelecionadoId !== null)
    {
      const sucesso = await this.supabaseService.updateGuess(
        guessId,
        this.golsApostadorEdicaoA,
        this.golsApostadorEdicaoB,
        this.jogoSelecionadoId
      );
      if (sucesso)
      {
        // Atualiza a linha modificada no Signal interno do modal sem precisar esperar nova requisição
        this.palpitesDoJogo.update(palpites =>
          palpites.map(p => p.id === guessId ? {
            ...p,
            goals_team_a: this.golsApostadorEdicaoA,
            goals_team_b: this.golsApostadorEdicaoB
          } : p)
        );
        this.apostadorEmEdicaoId = null;
        alert('Palpite alterado com sucesso!');
      }
    }
  }

  // BLINDADO: Remove da interface imediatamente após a confirmação do banco
  async excluirApostador(guessId: number, nome: string)
  {
    if (confirm(`Remover o palpite de ${nome}?`))
    {
      const sucesso = await this.supabaseService.deleteGuess(guessId);
      if (sucesso)
      {
        // Remove imediatamente do modal reativo
        this.palpitesDoJogo.update(palpites => palpites.filter(p => p.id !== guessId));

        if (this.jogoSelecionadoId)
        {
          if (this.supabaseService.activeMatch()?.id === this.jogoSelecionadoId)
          {
            await this.supabaseService.loadGuessesForMatch(this.jogoSelecionadoId);
          }
        }
      }
    }
  }

  efetuarLogout()
  {
    this.supabaseService.logout();
    this.router.navigate(['/login']);
  }
}
