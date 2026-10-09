---
title: Rich Presence não aparece no Discord? Uma lista de verificação que funciona
description: Seu status no Discord fica vazio enquanto você assiste ou ouve algo? Confira estes itens na ordem, das configurações do Discord à página que você abriu.
category: troubleshooting
order: 1
updated: 2026-10-09
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

Uma Rich Presence percorre uma cadeia de cinco elos: a página que você abriu, a presença daquele site, a extensão de navegador, o app de desktop e o aplicativo Discord. Se seu status continuar vazio, um desses elos falhou. Descobrir qual deles é mais rápido do que reinstalar tudo. Siga as verificações abaixo na ordem. A maioria dos problemas se resolve nos quatro primeiros itens.

## Comece pelo diagnóstico do Nowly

Abra o painel lateral do Nowly (**Ctrl+Shift+Y** ou **Cmd+Shift+Y** no Mac) na aba que você quer compartilhar. O diagnóstico mostra seis linhas: **Extensão instalada**, **Scripts de usuário permitidos**, **Nowly Desktop detectado**, **Discord conectado**, **Uma presença instalada** e **Atividade detectada**.

Leia-as de cima para baixo e pare na primeira que não estiver verde. Cada seção abaixo corresponde a uma delas, além de alguns casos que o diagnóstico não consegue detectar pelo navegador.

## 1. Você está usando o aplicativo Discord para desktop

A Rich Presence só funciona com o aplicativo Discord instalado no computador. O Discord em uma aba do navegador, no celular ou em outro computador não receberá a atividade, mesmo que você esteja conectado à mesma conta.

Se você usa as duas versões, feche a versão de navegador do Discord: ela pode dar a impressão de que seu status está vazio enquanto o app de desktop o mostra a todos os outros.

## 2. O Discord tem permissão para mostrar sua atividade

O Discord pode ocultar sua atividade mesmo quando a recebe:

- Abra **Configurações de usuário**, depois **Privacidade de atividade**, e ative a opção que compartilha sua atividade atual.
- Confira seu status. **Invisível** oculta sua atividade de todos.
- Alguns servidores permitem desativar o compartilhamento de atividade só para aquele servidor, nas configurações de privacidade dele. Se um amigo em um servidor não consegue ver sua atividade, mas outras pessoas conseguem, confira essa opção.

Uma forma rápida de distinguir os casos: se a atividade aparece no seu próprio perfil, mas não no perfil visto por um amigo, o problema está em uma configuração de privacidade do Discord, não no Nowly.

## 3. O app de desktop está instalado e em execução

Se **Nowly Desktop detectado** estiver em vermelho, a extensão não consegue alcançar o app de desktop.

- Instale-o pela [página do app de desktop](/desktop), se ainda não o fez, e clique em **Verificar conexão** no painel lateral.
- Se acabou de instalá-lo, feche e reabra o painel lateral ou reinicie o navegador para que ele reconheça o novo app.
- Instale o app no mesmo computador que o navegador. A conexão não funciona entre máquinas diferentes.
- No Linux, as causas mais comuns são um pacote `.deb` que não foi realmente instalado ou um navegador instalado via Flatpak ou Snap. Veja [Nowly no Linux](/guides/nowly-on-linux).

## 4. O Discord está conectado

Se **Nowly Desktop detectado** estiver verde, mas **Discord conectado** estiver vermelho, o app de desktop não consegue se comunicar com o Discord.

- Inicie o aplicativo Discord para desktop e espere que ele carregue completamente. Depois clique em **Verificar conexão**.
- No Windows, a causa mais comum é o Discord rodando como administrador. A correção leva um minuto: [Resolva o erro "Acesso negado" em discord-ipc-0](/guides/discord-ipc-access-denied).
- Se você usa Discord PTB ou Canary ao lado da versão comum, feche todas as versões menos uma.

## 5. Scripts de usuário estão permitidos

Se **Scripts de usuário permitidos** estiver em vermelho, o navegador está bloqueando as presenças. Ative **Permitir scripts de usuário** na página de detalhes do Nowly (ou **Modo de desenvolvedor** nas versões antigas do Chrome) e recarregue a aba. Veja as instruções completas por navegador em [Por que o Nowly pede permissão para scripts de usuário](/guides/allow-user-scripts).

## 6. A presença certa está instalada e ativada

Cada site exige sua própria presença. Se **Uma presença instalada** estiver verde, mas nada acontecer em um site, abra a página dele na [biblioteca](/library) e confira se aparece **Instalada**. Depois, no painel lateral:

- Confira se a presença está ativada.
- Confira se o compartilhamento não está pausado. Nesse caso, o painel lateral mostra **Compartilhamento pausado**. Retome com o botão de pausa ou com **Ctrl+Shift+U**.
- Confira se a presença não foi suspensa temporariamente e se você não está **Fora do seu agendamento**, caso tenha definido horários de compartilhamento.
- Confira se a própria aba não está oculta pela opção **Ocultar esta aba**.

## 7. A presença suporta a página aberta

**Atividade detectada** fica em vermelho quando a presença não tem nada a mostrar na página atual. Duas situações explicam quase todos os casos:

- **Você está navegando, não assistindo.** A maioria das presenças só compartilha o que está sendo reproduzido: um vídeo, episódio, faixa ou transmissão ao vivo. Na maioria delas, página inicial, buscas e catálogos não mostram nada, a menos que você ative **Mostrar atividade de navegação** nas configurações da presença. A página de cada presença na biblioteca explica o que ela mostra por padrão.
- **O endereço não é suportado.** A página de cada presença na biblioteca lista os endereços em que ela funciona, em **Sites suportados**. Prime Video, por exemplo, funciona em `primevideo.com`. Se o site mudou de endereço ou de estrutura, use **Relatar um problema** na página da presença.

Depois de instalar uma presença ou alterar uma configuração, recarregue a aba uma vez. Uma página aberta antes da instalação ainda não tem aquela presença.

## 8. Outra ferramenta de Rich Presence não está interferindo

Outras ferramentas que definem sua atividade no Discord, como PreMiD ou um reprodutor de música com Rich Presence própria, podem substituir ou limpar o que o Nowly envia. Desative-as durante o teste. Um jogo que você esteja jogando também pode ocupar o espaço da atividade mostrada no seu perfil.

## 9. Ainda não aparece nada?

- Recarregue a aba e depois reinicie o navegador e o Discord. Parece básico, mas isso refaz todas as conexões da cadeia.
- Atualize a extensão, o app de desktop e o Discord.
- Abra os logs de execução da extensão e clique em **Copiar logs** para colá-los em um ticket. Eles podem conter endereços de páginas suportadas que você visitou; leia-os antes de compartilhar.
- Abra um ticket no servidor do Nowly no Discord ou relate o problema pela página da presença na biblioteca, se apenas um site for afetado.

## A cadeia em uma frase

A página precisa ser suportada, a presença deve estar instalada e rodando, os scripts de usuário precisam estar permitidos, o app de desktop deve estar acessível e o Discord precisa estar aberto e autorizado a mostrar sua atividade. Encontre o primeiro elo que falhou, corrija-o, e o restante geralmente volta a funcionar.
