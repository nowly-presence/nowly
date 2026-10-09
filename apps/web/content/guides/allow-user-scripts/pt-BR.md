---
title: Por que o Nowly pede permissão para scripts de usuário e como concedê-la
description: Entenda a permissão para scripts de usuário, por que as presenças precisam dela, como ativá-la no Chrome, Edge, Brave, Opera e Firefox e o que ela não permite.
category: start
order: 2
updated: 2026-10-09
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

Durante a configuração, o Nowly pede uma permissão que a maioria das extensões não solicita: executar scripts de usuário. O nome parece técnico, e o aviso do navegador pode assustar um pouco. Este guia explica o alcance real da permissão, por que ela é importante para o Nowly e como ativá-la em cada navegador compatível.

## O que é um script de usuário

Um script de usuário é um pequeno trecho de JavaScript que roda sobre o código de uma página que você abre. Navegadores oferecem suporte a esses scripts há muito tempo por meio de complementos como o Tampermonkey.

Desde o Manifest V3, o formato atual das extensões do Chrome, o navegador faz uma distinção clara. O código incluído no pacote de uma extensão enviada à loja é analisado junto com ela. Já o código que uma extensão adiciona depois da instalação é tratado como script de usuário e só roda depois que você o autoriza explicitamente. O Firefox segue a mesma ideia com sua própria solicitação de permissão.

## Por que as presenças são scripts de usuário

Cada presença do Nowly é o código que entende o funcionamento de um site: onde o YouTube coloca o título do vídeo, como a Netflix informa o número do episódio, quando o Spotify está reproduzindo ou pausado. São mais de 40 presenças, e os sites mudam de estrutura com frequência.

Se todas as presenças viessem embutidas na extensão, cada correção exigiria uma nova versão da extensão e uma nova análise pela loja. Além disso, você teria código para dezenas de sites que nunca visita. Em vez disso, a extensão continua pequena, e as presenças são instaladas separadamente pela [biblioteca](/library):

- Você instala apenas as plataformas que usa.
- Uma presença com defeito pode ser corrigida e republicada em poucas horas, sem atualizar a extensão.
- Uma presença roda somente nos endereços listados para ela. A presença do YouTube, por exemplo, roda em `www.youtube.com` e `m.youtube.com`, e em nenhum outro lugar.

## Como o Nowly protege as presenças

É justamente porque executar código baixado exige cuidado que os navegadores pedem autorização. O Nowly acrescenta suas próprias verificações:

- Cada presença oficial é assinada pela equipe do Nowly com uma chave ECDSA P-256. Antes de registrar um script, a extensão verifica a assinatura e os hashes SHA-256 do pacote e de seus metadados. Um script modificado depois da assinatura é recusado.
- O código-fonte de cada presença é público; qualquer pessoa pode examiná-lo antes da instalação.
- As presenças entregam o que encontram à extensão, que transmite esses dados ao app de desktop no computador e depois ao Discord. Nada nesse caminho passa pelos servidores do Nowly, e o código das presenças é analisado antes de receber a assinatura.
- Pacotes sem assinatura só são aceitos em builds de desenvolvimento carregados manualmente, nunca na versão da loja.

## Ative no Chrome, Edge, Brave e Opera

1. Abra a página de extensões: `chrome://extensions` no Chrome, `edge://extensions` no Edge, `brave://extensions` no Brave ou `opera://extensions` no Opera.
2. Encontre **Nowly** e clique em **Detalhes**.
3. Ative **Permitir scripts de usuário**.
4. Recarregue as abas dos sites cuja atividade você quer mostrar no Discord.

Em versões antigas do Chrome e de navegadores Chromium, a opção **Permitir scripts de usuário** ainda não existe. Nesse caso, os scripts de usuário são habilitados pela opção **Modo de desenvolvedor**, no canto superior direito da página de extensões. Ativá-la não muda a forma como a versão do Nowly instalada pela loja é atualizada ou verificada.

## Ative no Firefox

O Firefox solicita a permissão uma vez durante a configuração inicial do Nowly. Aceite-a e pronto.

Se você dispensou a solicitação, abra `about:addons`, selecione **Nowly**, abra a aba **Permissões** e conceda a permissão para scripts de usuário. Em seguida, recarregue as abas que você quer mostrar.

## Confira se funcionou

Abra o painel lateral do Nowly com **Ctrl+Shift+Y** (**Cmd+Shift+Y** no Mac). No diagnóstico, a linha **Scripts de usuário permitidos** deverá estar verde. Assim que ela ficar verde, o Nowly registrará as presenças instaladas; a próxima linha a conferir é **Atividade detectada** em uma página suportada.

Se a linha continuar vermelha depois de ativar a permissão:

- Recarregue a extensão pela página de extensões ou reinicie o navegador.
- Confira se você alterou a configuração do Nowly, e não a de outra extensão.
- Se uma escola ou empresa gerencia seu navegador, as políticas dela podem bloquear scripts de usuário em todas as extensões.

## O que a permissão não faz

Permitir scripts de usuário não dá ao Nowly acesso às suas senhas, a outras extensões ou aos seus arquivos. Isso permite à extensão registrar scripts para sites específicos; o navegador continua impondo a lista de endereços de cada script. O Nowly não usa essa permissão para ler páginas que nenhuma presença instalada suporta.

Você pode revogar a permissão quando quiser. As presenças deixarão de rodar e o Discord deixará de mostrar sua atividade, mas nada será apagado: ao reativá-la, tudo voltará a funcionar como antes.

## Em resumo

Os scripts de usuário permitem que o Nowly suporte dezenas de sites com uma extensão pequena, atualize presenças rapidamente e instale somente o que você precisa. A permissão é concedida uma vez por navegador, e cada presença que a utiliza é assinada, pública e limitada aos próprios sites.
