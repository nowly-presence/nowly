---
title: Como configurar o Nowly e mostrar sua atividade no Discord
description: Um passo a passo completo, da extensão de navegador ao app de desktop, sua primeira presença e as verificações que confirmam que tudo funciona.
category: start
order: 1
updated: 2026-10-09
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

O Nowly mostra o que você assiste, ouve ou navega em sites como uma Rich Presence no Discord: o cartão sob seu nome com título, capa, barra de progresso e, às vezes, um botão. A configuração leva cerca de cinco minutos e exige três componentes: uma extensão de navegador, um pequeno app de desktop e uma presença para cada site que você quer mostrar. Este guia percorre cada etapa na ordem e termina com as verificações que confirmam que tudo está conectado.

## O que você precisa antes de começar

- **Um computador**: Windows 10 ou 11, macOS 11 Big Sur ou mais recente, ou uma distribuição Linux de 64 bits.
- **Um navegador**: Chrome, Edge, Brave, Opera ou outro navegador Chromium, ou Firefox.
- **O aplicativo Discord para desktop**, instalado e conectado à sua conta. O Discord em uma aba do navegador ou no celular não pode receber uma Rich Presence de outro programa e, portanto, não funciona com o Nowly.

Você não precisa de uma conta Nowly. Tudo o que vem a seguir é gratuito.

## Etapa 1: instale a extensão de navegador

Abra a [página da extensão](/extension) no navegador que você usa diariamente. O botão leva à loja apropriada: Chrome Web Store para Chrome, Edge, Brave e Opera; Firefox Add-ons para Firefox. Clique em **Adicionar**, confirme e fixe o ícone do Nowly na barra de ferramentas para mantê-lo a um clique de distância.

O Nowly fica no painel lateral do navegador (a barra lateral no Firefox). Abra-o pelo ícone da barra de ferramentas ou com **Ctrl+Shift+Y** (**Cmd+Shift+Y** no Mac). Na primeira vez, uma breve configuração inicial explica cada etapa. Você pode segui-la ou continuar a leitura aqui: as etapas são as mesmas.

## Etapa 2: permita scripts de usuário

Cada presença é um pequeno script que roda somente no site para o qual foi criada. Os navegadores chamam esses códigos de scripts de usuário e pedem sua permissão antes de executá-los.

- **Chrome, Edge, Brave, Opera**: abra `chrome://extensions` (ou `edge://extensions`, `brave://extensions`, `opera://extensions`), encontre o Nowly, clique em **Detalhes** e ative **Permitir scripts de usuário**. Em versões antigas do Chrome, essa opção ainda não existe: ative **Modo de desenvolvedor** no canto superior direito da página de extensões.
- **Firefox**: a configuração inicial pede a permissão uma vez. Aceite-a.

Se quiser entender exatamente o que essa permissão permite, leia [Por que o Nowly pede permissão para scripts de usuário](/guides/allow-user-scripts).

## Etapa 3: instale o app de desktop

O Discord só aceita uma Rich Presence de um programa executado no mesmo computador, por meio de uma conexão local que sites e extensões não podem abrir sozinhos. O app de desktop do Nowly (mostrado como Nowly Desktop na extensão) é esse programa. Ele não tem janela: o navegador o inicia quando o Nowly precisa dele, e ele transmite sua atividade ao Discord.

Abra a [página do app de desktop](/desktop). Ela detecta seu sistema e oferece o arquivo adequado.

- **Windows**: execute o instalador. O build ainda não foi assinado com um certificado pago, então o Windows SmartScreen pode exibir um aviso. Escolha **Mais informações** e depois **Executar assim mesmo**, mas apenas se você baixou o arquivo do nowly.me.
- **macOS**: abra a imagem de disco e siga as instruções. O app é notarizado pela Apple, então o Gatekeeper o aceita.
- **Linux**: no Debian, Ubuntu ou Mint, instale o pacote `.deb`. Em outras distribuições, baixe o arquivo compactado e execute o script de instalação contido nele. Se algo der errado, consulte [Nowly no Linux](/guides/nowly-on-linux).

## Etapa 4: abra o Discord e confira a configuração de atividade

Inicie o aplicativo Discord para desktop e deixe-o aberto. Depois confira se o Discord pode mostrar sua atividade: abra **Configurações de usuário**, depois **Privacidade de atividade**, e confirme que a opção de compartilhar sua atividade atual está ativada. O texto exato muda conforme a versão do Discord, mas é a opção que menciona sua atividade ou mensagem de status.

Lembre-se também de que, quando seu status está **Invisível**, ninguém vê sua atividade, independentemente do que o Nowly envie.

## Etapa 5: instale sua primeira presença

As presenças vêm da [biblioteca](/library). YouTube é o melhor primeiro teste, porque um vídeo começa a tocar em segundos:

1. Abra a [presença do YouTube](/library/youtube).
2. Espere a página detectar a extensão e clique em **Instalar**.
3. Abra um vídeo no YouTube e inicie a reprodução.

Você também pode instalar presenças sem sair do painel lateral: a aba **Biblioteca** da extensão mostra o mesmo catálogo. Antes de instalar cada presença, a extensão verifica sua assinatura digital.

## Etapa 6: leia o diagnóstico

Abra o painel lateral do Nowly. O diagnóstico lista seis verificações, e cada uma fica verde quando está pronta:

| Verificação | O que significa |
| --- | --- |
| Extensão instalada | A extensão está rodando neste navegador. |
| Scripts de usuário permitidos | O navegador permite ao Nowly executar presenças. |
| Nowly Desktop detectado | O app de desktop respondeu à extensão. |
| Discord conectado | O app de desktop alcançou o aplicativo Discord. |
| Uma presença instalada | Pelo menos uma presença está instalada. |
| Atividade detectada | Uma presença encontrou algo para mostrar na aba atual. |

Quando as seis linhas estiverem verdes, olhe seu perfil no Discord: você deverá ver **Assistindo YouTube** com o título do vídeo, o canal, a miniatura e uma barra de progresso. Se alguma linha continuar vermelha, resolva-a primeiro: ela indica o próximo elo da cadeia a corrigir. A [lista de solução de problemas](/guides/rich-presence-not-showing) cobre todos os casos.

## O que seus amigos veem

Com a presença do YouTube, um vídeo em reprodução mostra título, nome do canal, miniatura e tempo decorrido, além de um botão **Assistir ao vídeo**. Quando você pausa, um ícone de pausa substitui o de reprodução. Navegar pela página inicial ou pela busca do YouTube não mostra nada por padrão: a maioria das presenças compartilha apenas o que você está de fato assistindo ou ouvindo, e mostrar atividade de navegação é uma opção ativada individualmente para cada presença.

## Próximos passos

- Adicione as plataformas que realmente usa pela [biblioteca](/library): Netflix, Twitch, Crunchyroll, Spotify e mais de 40 outras.
- Saiba como pausar, ocultar uma aba ou compartilhar só em certos horários em [Escolha exatamente o que o Discord mostra sobre você](/guides/control-what-discord-shows).
- Quer entender o que acontece nos bastidores? Leia [O que é Discord Rich Presence?](/guides/what-is-discord-rich-presence).
