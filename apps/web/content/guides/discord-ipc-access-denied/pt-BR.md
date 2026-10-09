---
title: Corrija o erro "Acesso negado" em discord-ipc-0 (Windows)
description: Entenda por que o Windows bloqueia a conexão entre Nowly e Discord quando o Discord é executado como administrador e siga cinco passos para resolver o problema de vez.
category: troubleshooting
order: 2
updated: 2026-10-09
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

No Windows, às vezes o Nowly mostra **Nowly Desktop detectado** em verde, mas **Discord conectado** em vermelho, e os logs contêm uma linha como esta:

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

O Nowly também pode mostrar uma mensagem explicando que o Discord bloqueia a conexão, e o app de desktop pode exibir uma notificação do Windows. A causa quase sempre é a mesma, e não se trata de um bug do Nowly nem do Discord: o Discord está sendo executado como administrador, mas seu navegador não.

## O que é discord-ipc-0

Programas que definem sua atividade no Discord, inclusive jogos, conversam com o aplicativo Discord por um canal local chamado pipe nomeado. No Windows, o primeiro canal se chama `\\.\pipe\discord-ipc-0`. O Discord o cria ao iniciar, e o app de desktop do Nowly o abre para enviar sua atividade.

Nada passa pela internet nessa etapa. É uma conversa entre dois programas no mesmo computador.

## Por que o Windows diz "Acesso negado"

O Windows separa os programas executados como administrador dos programas comuns. Um programa iniciado com **Executar como administrador** opera em um nível de integridade mais alto, e os objetos que ele cria, inclusive o pipe nomeado do Discord, ficam protegidos contra programas executados no nível normal.

Seu navegador roda no nível normal; portanto, o app de desktop do Nowly iniciado por ele também roda nesse nível. Se o Discord tiver sido iniciado como administrador, o Windows impede que o app no nível normal abra o pipe elevado, e a conexão falha com **Acesso negado**.

Jogos e outras ferramentas de Rich Presence enfrentam exatamente o mesmo obstáculo. Por isso, o erro muitas vezes aparece junto com a reclamação de que o Discord não mostra o jogo.

## Como corrigir, passo a passo

1. **Feche o Discord completamente.** Fechar a janela não basta: clique com o botão direito no ícone do Discord na área de notificação, perto do relógio, e escolha **Sair do Discord**.
2. **Confirme que não restou nenhum processo do Discord.** Abra o Gerenciador de Tarefas com **Ctrl+Shift+Esc** e finalize qualquer processo `Discord.exe` ainda em execução.
3. **Remova a configuração de administrador.** Clique com o botão direito no atalho do Discord que você usa, escolha **Propriedades**, abra a guia **Compatibilidade** e desmarque **Executar este programa como administrador**. Ainda em **Propriedades**, na guia **Atalho**, clique em **Avançado** e confira se **Executar como administrador** também está desmarcado. Se o botão **Alterar configurações de todos os usuários** mostrar a opção marcada, desmarque-a ali também.
4. **Inicie o Discord normalmente**, com um clique duplo comum.
5. **Reconecte o Nowly.** Clique em **Reconectar** no painel lateral do Nowly ou reinicie o navegador.

**Discord conectado** deverá ficar verde, e sua atividade deverá aparecer em poucos segundos.

## Se o Discord continuar iniciando como administrador

- Verifique todos os atalhos que você usa: na área de trabalho, no menu Iniciar e na barra de tarefas. Cada um tem suas próprias configurações.
- Se o Discord inicia junto com o Windows, talvez uma tarefa agendada ou um gerenciador de inicialização de terceiros esteja configurado para usar os privilégios mais altos. Remova essa opção ou recrie a entrada sem ela.
- Algumas pessoas executam o Discord como administrador para que o recurso de apertar para falar funcione em jogos que também rodam como administrador. Nesse caso, é preciso escolher: ou o Discord e o jogo rodam normalmente, ou a Rich Presence do navegador não consegue alcançar o Discord.

## O que não fazer

Não execute o navegador nem force o app de desktop do Nowly a rodar como administrador para contornar o problema. Os navegadores iniciam o app de desktop por conta própria, por meio de um mecanismo chamado mensagens nativas. Executar o navegador com privilégios totais de administrador expõe o sistema inteiro a qualquer falha que ocorra em uma página. A solução correta é sempre fazer o Discord voltar ao nível normal.

## Discord PTB e Canary

No Windows, o app de desktop do Nowly se conecta ao primeiro pipe do Discord, `discord-ipc-0`. Se você executar o Discord Stable junto com o Discord PTB ou Canary, a versão que iniciar primeiro terá esse pipe, e sua atividade só aparecerá nela. Mantenha apenas um aplicativo Discord aberto para evitar surpresas.

## Ainda está bloqueado?

Se o erro desapareceu, mas seu status continua vazio, o problema está mais adiante na cadeia. Volte à [lista de solução de problemas](/guides/rich-presence-not-showing) e continue a partir da etapa **Scripts de usuário permitidos**. Se os logs ainda disserem **Access is denied** depois das etapas acima, abra um ticket no servidor do Nowly no Discord e informe sua versão do Windows e como você inicia o Discord.
