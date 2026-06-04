import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class Auth
{

  // Esse sinal guarda se o Admin está logado ou não. Começa como falso (fechado)
  private isAdminLogged = signal<boolean>(false);

  // ESTA É A SUA SENHA MOÍDA (HASH SHA-256) para a palavra "brasil2026"
  // Se você quiser que sua senha seja "brasil2026", deixe esse código abaixo.
  // Curiosos que olharem o site só verão esse amontoado de letras e números esquisitos!
  private correctHash = 'b2933924a6549a1d47936a282662c1bb89853ebfcf38b4d8d3202970c39f0321';

  // Função que verifica se quem está acessando tem permissão
  isAuthenticated()
  {
    return this.isAdminLogged();
  }

  // Função que o botão de Entrar vai chamar
  async tryToLogin(typedPassword: string): Promise<boolean>
  {
    // Pegamos o que você digitou e passamos pelo mesmo "moedor" matemático
    const typedHash = await this.gerarHashTexto(typedPassword);

    // Comparamos as duas carnes moídas
    if (typedHash === this.correctHash)
    {
      this.isAdminLogged.set(true); // Abre a porta do painel!
      return true;
    }

    return false; // Senha errada
  }

  logout()
  {
    this.isAdminLogged.set(false);
  }

  // O "Moedor de Carne" Matemático (SHA-256) nativo do navegador
  private async gerarHashTexto(texto: string): Promise<string>
  {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
