---
title: Mostre o que você está assistindo no Discord (Netflix, Prime Video, Disney+ e mais)
description: Saiba como exibir a série ou o filme a que você assiste no seu status do Discord, o que cada presença de streaming mostra e por que isso funciona mesmo quando o compartilhamento de tela fica preto.
category: start
order: 3
updated: 2026-10-09
related: set-up-nowly, control-what-discord-shows, rich-presence-not-showing
---

O Discord mostra automaticamente o jogo que você está jogando, mas não a série a que assiste no navegador. Com o Nowly, seu perfil pode mostrar **Assistindo Netflix**, com título, episódio, pôster e progresso, e seus amigos podem abrir o mesmo episódio com um clique. Este guia explica como configurar o recurso nos serviços de streaming e o que esperar de cada um.

## O que você precisa

Se você ainda não configurou o Nowly, siga primeiro [Como configurar o Nowly](/guides/set-up-nowly): extensão, scripts de usuário, app de desktop e aplicativo Discord para desktop. Depois instale pela [biblioteca](/library) uma presença para cada serviço que usa. Há presenças de streaming para Netflix, Prime Video, Disney+, Crunchyroll, HBO Max, Paramount+, Peacock, Apple TV+, Canal+ e ADN, entre outros.

## O que seus amigos verão

Uma presença de streaming preenche o cartão de Rich Presence com o que está na tela. Com a Netflix, por exemplo:

- **Assistindo Netflix** na parte superior.
- O título da série ou do filme na primeira linha.
- No caso de uma série, temporada e episódio no formato `S1.E3`, seguidos do título do episódio. No caso de um filme, o ano.
- O pôster como imagem principal e um ícone de reprodução ou pausa.
- Durante a reprodução, o tempo decorrido e o tempo restante.
- Um botão, **Assistir ao episódio** ou **Assistir ao filme**, que abre o mesmo título para seus amigos.

Prime Video e Disney+ funcionam de modo semelhante, mostrando temporada e episódio quando esses dados aparecem no reprodutor. O Crunchyroll mostra a série, o título do episódio e uma capa, além de um botão para a página da série.

## Assistir, não apenas navegar

Por padrão, as presenças de streaming se concentram no que está no reprodutor, para que seu status não mude a cada vez que você fica em dúvida entre duas séries. Os detalhes variam um pouco:

- **Netflix** não mostra nada até começar a reprodução de um título: página inicial, busca e páginas de títulos permanecem privadas.
- **Prime Video** e **Disney+** também mostram a página do título que você abriu, como **Vendo detalhes** ou **Vendo uma série**, com o respectivo nome. Página inicial, busca e listas permanecem privadas.
- **Crunchyroll** também mostra suas páginas principais, como a página de uma série, o calendário de simulcasts, sua lista para assistir ou uma busca. Ative o **Modo de privacidade** para ocultar os títulos.

Para mostrar mais, ative **Mostrar atividade de navegação** nas configurações da presença no painel lateral. Seu status passará a acompanhar você na página inicial, em listas e na busca, onde poderá mostrar o que você digitou.

## Por que funciona quando o compartilhamento de tela não funciona

Se você já tentou compartilhar a tela pelo Discord enquanto assistia à Netflix, provavelmente viu um retângulo preto no lugar do vídeo. Serviços de streaming protegem seus vídeos com DRM, e os navegadores impedem que vídeos protegidos apareçam nas capturas de tela.

A Rich Presence é diferente: nunca envia o vídeo, apenas textos e um pôster que o descrevem. Por isso funciona com todos esses serviços sem violar as regras da plataforma. Se quiserem assistir juntos, usem o recurso de visualização em grupo do serviço, quando houver, e deixem que seu status no Discord conte aos amigos o que está passando.

## Guarde algumas coisas para você

Nem toda noite precisa de plateia. Algumas opções rápidas:

- **Pause tudo** com **Ctrl+Shift+U** (**Cmd+Shift+U** no Mac) e pressione novamente para retomar.
- Use **Ocultar esta aba** no painel lateral para manter uma aba privada enquanto as demais continuam sendo compartilhadas.
- **Suspenda temporariamente** uma presença por uma hora, quatro horas ou até amanhã.
- **Compartilhe apenas em certos horários** com um agendamento, seja para todas as presenças, seja apenas para as de streaming.
- No **Crunchyroll**, ative o **Modo de privacidade** para ocultar o título sem deixar de mostrar que você está assistindo.

Todos os detalhes estão em [Escolha exatamente o que o Discord mostra sobre você](/guides/control-what-discord-shows).

## Se seu status continuar vazio

- Confira se o título está realmente em reprodução no navegador, e não em um aplicativo de TV ou no celular.
- Confira se você está em um endereço suportado pela presença: Prime Video funciona em `primevideo.com` e Netflix, em `netflix.com`.
- Recarregue a aba uma vez após instalar a presença.

Para outros casos, a [lista de solução de problemas](/guides/rich-presence-not-showing) examina cada elo da cadeia.
