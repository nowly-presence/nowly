---
title: Crie sua primeira presença para o Nowly
description: De uma pasta vazia a uma atividade funcional no Discord: ferramentas necessárias, arquivos de uma presença, primeiro script, testes locais e publicação.
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Cada plataforma na biblioteca do Nowly está lá porque alguém criou uma presença para ela. Se falta um site que você usa, você pode adicioná-lo. Uma presença é um pequeno projeto em TypeScript, geralmente com menos de cem linhas na primeira versão. A CLI do Nowly cuida da estrutura inicial, da compilação e dos testes locais. Este guia leva você do zero até uma presença que atualiza seu status no Discord. A referência completa está na [documentação do Nowly](https://docs.nowly.me/).

## O que você precisa

- **Node.js 22 ou mais recente** e **pnpm**, para executar a CLI e compilar presenças.
- **Git**, para clonar o repositório de presenças e abrir uma solicitação de incorporação (pull request).
- **Um navegador Chromium ou Firefox**, além do **aplicativo Discord para desktop** e do [app de desktop do Nowly](/desktop) instalado, para fazer testes reais.
- Conhecimentos básicos de JavaScript ou TypeScript e das ferramentas de desenvolvedor do navegador para inspecionar a página desejada.

## Obtenha o repositório e a CLI

Todas as presenças da comunidade estão em um repositório público, sob a licença MIT:

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install` também vincula o pacote `@nowly/sdk`, que fornece ao editor os tipos da API de Presenças.

## Crie a estrutura de uma presença

```bash
nowly init "Example"
```

A CLI faz algumas perguntas e cria uma pasta em `src/E/Example/`, organizada pela primeira letra da plataforma:

- `metadata.json`: nome, autor, endereços suportados, categoria, cor, descrições e configurações da presença.
- `presence.ts`: código que lê a página e define a atividade.
- `locales/`: textos mostrados no Discord, um arquivo por idioma.
- `assets/`: logo, ícone e miniatura usados no Discord e na biblioteca.

A CLI também pergunta se o Discord já mostra essa plataforma por meio de uma conta vinculada. Se sim, ela marca a presença para que a biblioteca possa avisar aos usuários.

## Descreva a plataforma em metadata.json

Os campos mais importantes são os endereços. `url` lista os nomes de host, enquanto `regExp` é o padrão ao qual o endereço de uma página precisa corresponder para a presença rodar. Restrinja-os tanto quanto o site permitir: uma presença nunca deve rodar em páginas que não compreende.

`category` aceita um dos valores `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` ou `other`. As descrições são escritas por idioma, com o inglês usado quando não há tradução.

## Escreva uma primeira presença

`Presence` e `Assets` são fornecidos pelo ambiente de execução. Apenas utilitários como `PresenceType` são importados do SDK:

```ts
import { PresenceType } from "@nowly/sdk"

const presence = new Presence()

presence.on("UpdateData", async () => {
  await presence.setActivity({
    details: document.title,
    state: document.location.hostname,
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
```

`UpdateData` é disparado periodicamente enquanto a página está aberta e sempre que o usuário altera uma configuração. A cada disparo, leia a página e envie a atividade. Quando não houver nada relevante a mostrar, chame `presence.clearActivity()` em vez de enviar um status vazio.

Para conteúdo multimídia, `createMediaTimestamps(video)`, do SDK, transforma um elemento `audio` ou `video` nos horários de início e fim de que o Discord precisa para exibir uma barra de progresso.

## Respeite quem usa a presença

As presenças da biblioteca seguem algumas regras importantes para os usuários:

- Mostre o que a pessoa está realmente fazendo, não todas as páginas que visita. Coloque páginas de navegação atrás de uma configuração **Mostrar atividade de navegação**, desativada por padrão.
- Ofereça uma opção de privacidade quando o conteúdo puder ser pessoal: um modo que oculte títulos ou a exclusão de conversas privadas do Discord.
- Nunca envie dados para nenhum outro destino além da atividade e não leia mais do que ela exige.
- Use os textos traduzidos de `locales/` em tudo o que aparecer no Discord.

## Compile e teste localmente

Valide os metadados e os recursos visuais antes de compilar:

```bash
nowly validate
nowly build example
```

Se o Nowly ainda não estiver instalado no seu navegador, inclua a presença em uma extensão de desenvolvimento pronta para uso:

```bash
nowly extension example
nowly extension example --firefox
```

Carregue `dist/extension-dev` como extensão descompactada em `chrome://extensions`, com o **Modo de desenvolvedor** ativado. No Firefox, carregue `dist/extension-dev-firefox/manifest.json` como complemento temporário em `about:debugging`. Abra o site escolhido; seu status no Discord deverá mudar.

Se você já usa um build de desenvolvimento do Nowly carregado como extensão descompactada, agilize as iterações criando um zip:

```bash
nowly pack example
```

Depois arraste `dist/packs/example.zip` até a seção **Configurações**, **Avançado**, **Depuração** da extensão. Arquivos zip sem assinatura só são aceitos em builds descompactados, nunca na versão da loja.

## Publique a presença

1. Execute `nowly validate` mais uma vez e confira a presença em algumas páginas reais, inclusive quando nada estiver em reprodução.
2. Abra uma solicitação de incorporação (pull request) no repositório de presenças, com uma breve descrição e uma captura de tela do status no Discord.
3. A equipe revisa o código, assina a versão e a publica na biblioteca. A partir daí, qualquer pessoa pode instalá-la com um clique, e você aparecerá como autor na página dela na biblioteca.

## Para ir além

A documentação aborda toda a API de Presenças, configurações, localização, marcações de tempo, iframes e o proxy de imagens para capas que o Discord não consegue carregar diretamente. Comece por [Criando sua primeira presença](https://docs.nowly.me/presence-development/creating-your-first-presence) e consulte as [diretrizes de contribuição](https://docs.nowly.me/publishing/contribution-guidelines) antes de abrir sua solicitação de incorporação.
