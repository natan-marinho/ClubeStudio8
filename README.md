# App Clube Studio 8

App Android (React Native + Expo SDK 58) para a barbearia Clube Studio 8.
Sem servidor e sem login: tudo fica salvo no próprio celular (AsyncStorage).

## Telas

| Tela | O que faz |
|---|---|
| **Agenda** | Faixa de dias, agendar para hoje ou outro dia escolhendo o cliente. Tocar no horário abre: Ligar, Enviar lembrete (WhatsApp), Compareceu, Falta, Desmarcar, Oferecer vaga, Recuperado, Remarcar. Resumo do período com “Copiar resumo”. (Trabalho 3) |
| **Clientes** | Nome, telefone e autorização LGPD para lembretes. Busca, ligar, contagem de visitas e faltas. |
| **Limpeza** | Rotinas do dia (abertura, a cada cliente, meio do dia, fechamento) e da semana (limpeza e manutenção das máquinas), com alarme. (Trabalho 4) |
| **Compras** | Itens a comprar com atalhos. (Trabalho 4) |
| **Segurança** | Processos com lâminas, guia de descarte (Lei 12.305/2010 e RDC Anvisa 222/2018) e notas da IA com o prompt pronto do ChatGPT. (Trabalho 4) |

Identidade visual: verde-limão #C4DC1E, preto #111111 e grafite (mesma paleta dos posts), títulos em Bebas Neue e textos em Montserrat.

## Estrutura

```
App.js                          cabeçalho da marca, barra inferior e fontes
src/data.js                     clientes + agendamentos (contexto compartilhado)
src/agenda/AgendaScreen.js
src/clientes/ClientesScreen.js
src/rotinas/LimpezaScreen.js    rotinas + alarmes
src/rotinas/ComprasScreen.js
src/seguranca/SegurancaScreen.js
src/seguranca/conteudo.js       prompt da IA, processos com lâminas e guia de descarte (fixos)
src/alarms.js · src/storage.js · src/theme.js · src/components.js
plugins/withCmakeVersion.js     corrige o build no Windows (caminhos > 260 caracteres)
```

Chaves no AsyncStorage: `cs8:clientes`, `cs8:agendamentos`, `cs8:rotinas:v2`, `cs8:compras`, `cs8:instrucoes`.

## Gerar o APK (local, sem conta Expo)

Requisitos: Node, JDK 17+ e Android SDK (`ANDROID_HOME`).

```bash
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease "-PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64"
```

O APK sai em `android/app/build/outputs/apk/release/app-release.apk`.
(O release usa a chave de debug, o que basta para instalar direto no celular, mas não para a Play Store.)

Alternativa na nuvem: `npx eas-cli@latest build -p android --profile preview`.

## Checklist de testes antes da visita

- [ ] Criar, editar e excluir em cada tela; fechar o app e abrir de novo: os dados continuam lá.
- [ ] Rotina com alarme para daqui a 2 minutos: toca com o app fechado e com a tela bloqueada.
- [ ] Virada do dia: as rotinas diárias voltam desmarcadas (dá para testar mudando a data do celular).
- [ ] "Enviar lembrete" abre o WhatsApp Business com a mensagem pronta.
- [ ] "Copiar resumo" e "Copiar prompt do assistente" copiam o texto.
- [ ] Instalar o APK num Android de teste.

Na primeira vez que um alarme é ativado, o app pede permissão de notificação e abre a tela
"Alarmes e lembretes" do Android (alarme exato). Sem ela o alarme ainda toca, mas pode atrasar.
