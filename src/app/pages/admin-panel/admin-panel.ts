import {Component, inject} from '@angular/core';
import {Auth} from '../../service/auth';
import {Router} from '@angular/router';
import {Guess, Supabase} from '../../service/supabase';
import {FormsModule} from '@angular/forms';
import {JsonPipe} from '@angular/common';

@Component({
  selector: 'app-admin-panel',
  imports: [
    FormsModule
  ],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel
{
  supabaseService = inject(Supabase);
  router = inject(Router);
  jogos = this.supabaseService.matches;

  // Campos para cadastrar novo jogo
  novoTimeA = '';
  novoTimeB = '';

  // Objetos temporários para gerenciar os inputs de cada jogo individualmente
  placaresEdicao: { [key: number]: { goalsA: number; goalsB: number } } = {};
  novosPalpites: { [key: number]: { nome: string; goalsA: number; goalsB: number } } = {};

  cadastrarJogo()
  {
    if (!this.novoTimeA.trim() || !this.novoTimeB.trim()) return;
    this.supabaseService.createMatch(this.novoTimeA, this.novoTimeB);
    this.novoTimeA = '';
    this.novoTimeB = '';
  }

  getPlacarCampos(matchId: number, currentA: number | null, currentB: number | null)
  {
    if (!this.placaresEdicao[matchId])
    {
      this.placaresEdicao[matchId] = {goalsA: currentA ?? 0, goalsB: currentB ?? 0};
    }
    return this.placaresEdicao[matchId];
  }

  // Inicializa ou recupera os campos do formulário de palpite para um jogo específico
  getPalpiteCampos(matchId: number)
  {
    if (!this.novosPalpites[matchId])
    {
      this.novosPalpites[matchId] = {nome: '', goalsA: 0, goalsB: 0};
    }
    return this.novosPalpites[matchId];
  }

  salvarPlacarOficial(matchId: number)
  {
    const dados = this.placaresEdicao[matchId];
    if (dados)
    {
      this.supabaseService.updateMatchScore(matchId, dados.goalsA, dados.goalsB);
      alert('Placar oficial atualizado!');
    }
  }

  adicionarPalpiteAmigo(matchId: number)
  {
    const dados = this.novosPalpites[matchId];
    if (!dados || !dados.nome.trim())
    {
      alert('Digite o nome do apostador!');
      return;
    }

    this.supabaseService.saveGuess(matchId, dados.nome, dados.goalsA, dados.goalsB);

    // Limpa o formulário daquele jogo após salvar
    this.novosPalpites[matchId] = {nome: '', goalsA: 0, goalsB: 0};
    alert('Palpite do amigo adicionado com sucesso!');
  }

  efetuarLogout()
  {
    this.supabaseService.logout();
    this.router.navigate(['/login']); // Redireciona para o login de imediato
  }

}
