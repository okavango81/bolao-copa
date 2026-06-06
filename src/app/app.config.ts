import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// IMPORTANTE: Importar a configuração regional do Brasil
import registerLocalePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';

// Registra os dados do idioma português
registerLocaleData(registerLocalePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Define o PT-BR como idioma padrão de todos os Pipes do sistema
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
};
