---
title: O que é Discord Rich Presence? Como funciona e o que pode mostrar
description: Entenda o cartão sob seu nome no Discord, desde os tipos e campos de atividade até a conexão local usada pelos programas para atualizá-lo e por que sites precisam de uma ponte.
category: discord
order: 1
updated: 2026-10-09
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

Se você já viu o perfil de um amigo no Discord indicar que está **Jogando** algo, com imagem, cronômetro e botão **Entrar**, já viu a Rich Presence. É o recurso que permite a um programa descrever em detalhes o que você faz, em vez de mostrar só um nome. Este guia explica o que compõe uma Rich Presence, como os programas a enviam ao Discord e por que mostrar a atividade de um site exige uma ferramenta como o Nowly.

## Do nome de um jogo a uma atividade detalhada

No início, o Discord detectava o jogo em execução e mostrava o nome dele sob o seu. A Rich Presence, criada para desenvolvedores de jogos, vai além: o próprio programa informa ao Discord o que está acontecendo, como o mapa, a pontuação ou o número de jogadores no seu grupo, e atualiza esses dados conforme eles mudam.

O mesmo mecanismo serve para outras atividades, não só jogos. Reprodutores de música, editores de código e ferramentas de streaming o utilizam; o Nowly o utiliza para sites.

## O que há em um cartão de Rich Presence

Uma Rich Presence reúne alguns campos. Nem todo programa preenche todos eles.

| Campo | O que mostra | Exemplo com YouTube |
| --- | --- | --- |
| Tipo de atividade | O verbo antes do nome | Assistindo |
| Nome | O aplicativo | YouTube |
| Detalhes | A primeira linha | O título do vídeo |
| Estado | A segunda linha | O nome do canal |
| Imagem grande | A imagem principal, com dica ao passar o cursor | A miniatura do vídeo |
| Imagem pequena | Um ícone no canto da imagem | Um ícone de reprodução ou pausa |
| Marcações de tempo | Tempo decorrido ou barra de progresso com início e fim | 14:10 de 26:48 |
| Botões | Até dois links que outras pessoas podem abrir | Assistir ao vídeo |

O tipo de atividade pode ser **Jogando**, **Ouvindo**, **Assistindo** ou **Competindo**. É por isso que uma presença de música diz **Ouvindo Spotify**, enquanto uma presença de vídeo diz **Assistindo Netflix**.

## Como os programas se comunicam com o Discord

A Rich Presence não passa primeiro pela internet. Quando inicia, o aplicativo Discord para desktop abre um canal local no computador: um pipe nomeado chamado `discord-ipc-0` no Windows ou um arquivo de socket com o mesmo nome no macOS e no Linux. Um programa que deseja definir sua atividade:

1. conecta-se a esse canal;
2. apresenta-se com um ID de aplicativo registrado no Discord, que dá nome e imagens à atividade;
3. envia os campos da atividade;
4. envia atualizações quando algo muda ou limpa a atividade quando você para.

Em seguida, o aplicativo Discord publica a atividade no seu perfil por meio dos servidores do Discord, para que seus amigos a vejam em qualquer dispositivo.

Como o canal é local, só programas executados no mesmo computador que o aplicativo Discord para desktop podem usá-lo. O Discord em uma aba do navegador ou no celular não abre esse canal.

## Por que os sites precisam de uma ponte

Um site não pode abrir esse canal local. Os navegadores impedem deliberadamente que páginas acessem o sistema, e as extensões também funcionam em ambientes isolados. Mesmo que o navegador saiba qual vídeo você está reproduzindo, ele não consegue contar isso diretamente ao Discord.

É essa lacuna que o Nowly preenche:

- uma **presença** lê a página no navegador e prepara a atividade;
- a **extensão de navegador** coleta os dados e aplica suas configurações;
- o **app de desktop** é o programa no seu computador que abre o canal local do Discord e envia a atividade.

O app de desktop é pequeno, não tem janela e é iniciado pelo navegador quando necessário. Sem ele, uma extensão de navegador sozinha não consegue atualizar a Rich Presence.

## Quem pode ver sua Rich Presence

Sua atividade aparece no perfil e nas listas de membros para quem pode ver seu status: amigos e membros de servidores em comum, a menos que você desative o compartilhamento de atividade nas configurações de **Privacidade de atividade** do Discord ou em um servidor específico. Se seu status for **Invisível**, ninguém verá sua atividade.

Os botões são destinados a outras pessoas: eles permitem que seus amigos abram o mesmo vídeo ou episódio.

## Limitações importantes

- **Uma atividade por aplicativo de cada vez.** Quando vários programas atualizam sua atividade, o Discord pode mostrar uma, várias ou alternar entre elas. Evite executar duas ferramentas para mostrar a mesma coisa.
- **Há um limite para a frequência de atualizações.** O Discord aceita um número limitado de atualizações em um curto período. Por isso, o status pode ficar alguns segundos atrás da página. As marcações de tempo permitem que o próprio Discord conte o tempo sem receber atualizações constantes.
- **O Discord precisa conseguir acessar as imagens.** O Discord baixa as imagens, não o seu computador; portanto, imagens privadas ou protegidas exigem um proxy. Veja em [O que o Nowly pode ver](/guides/what-nowly-can-see) como ele lida com isso.

## Rich Presence e as conexões integradas do Discord

O Discord também mostra certas atividades sem programas adicionais quando você vincula uma conta em **Conexões**, como a do Spotify. Essas integrações funcionam de outra maneira e têm suas próprias vantagens e desvantagens. Leia a comparação em [Conexões do Discord ou Nowly](/guides/discord-connections-vs-nowly).
