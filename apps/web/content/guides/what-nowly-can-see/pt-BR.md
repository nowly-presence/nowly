---
title: O que o Nowly pode ver e para onde vão seus dados
description: O caminho da sua atividade, da página ao Discord; o que uma presença lê, o que fica no computador e os poucos recursos opcionais que entram em contato com o Nowly.
category: privacy
order: 2
updated: 2026-10-09
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

Uma ferramenta que sabe o que você assiste precisa responder claramente a uma pergunta simples: para onde vão essas informações? Este guia acompanha sua atividade passo a passo, mostra o que permanece no seu dispositivo e esclarece quais recursos opcionais entram em contato com os servidores do Nowly. É um complemento em linguagem simples à [política de privacidade](/privacy), que continua sendo a referência.

## Em poucas palavras

Sua atividade vai da página da web ao aplicativo Discord no seu próprio computador, sem passar por nenhum outro lugar. Ela nunca passa pelo nowly.me nem pela API do Nowly. As estatísticas de uso permanecem desativadas até você ativá-las, e criar uma conta é opcional.

## O caminho da sua atividade

Veja o que acontece quando você inicia a reprodução em um site suportado:

1. **A presença lê a página.** A presença daquele site roda na aba do navegador e lê o necessário: título, número do episódio, nome do canal, se o vídeo está em reprodução.
2. **A extensão prepara a atividade.** Ela aplica suas configurações (pausa, agendamentos, modos de privacidade e idioma) e monta a Rich Presence.
3. **O app de desktop recebe a atividade.** A extensão a envia ao app de desktop do Nowly por mensagens nativas, um canal entre o navegador e um programa no mesmo computador.
4. **O Discord a recebe localmente.** O app de desktop a repassa ao aplicativo Discord pela conexão local do Discord.
5. **O Discord a compartilha.** A partir daí, o aplicativo Discord envia a atividade aos servidores do Discord para que seus amigos a vejam, conforme a política de privacidade do próprio Discord.

As etapas de 1 a 4 acontecem no seu computador. Os servidores do Nowly não fazem parte desse caminho.

## O que uma presença lê

Uma presença só lê a página para a qual foi criada, e somente o que precisa para compor seu status. A presença do YouTube lê o título do vídeo, o canal, o endereço da miniatura e a posição de reprodução. A do Spotify lê a faixa em reprodução no navegador. Uma presença não lê outras abas, seu histórico de navegação, campos de formulário ou senhas.

Alguns sites só expõem certos detalhes por meio dos próprios dados. A presença da Netflix, por exemplo, consulta o site da Netflix para obter o título e o episódio em reprodução, de dentro da aba da Netflix, exatamente como a própria página faz.

## Capas e o proxy de imagens

O Discord precisa baixar as imagens exibidas no seu status. As imagens da maioria das plataformas são públicas, e o Discord as carrega diretamente. Outras, como pôsteres da Netflix, não podem ser carregadas pelo Discord da forma original. Nesses casos, a presença usa o proxy de imagens do Nowly: o endereço da imagem passa pela API do Nowly, que a busca para que o Discord possa exibi-la.

Esse endereço pode estar associado ao título a que você está assistindo, e é importante deixar isso claro. O proxy serve apenas para essa finalidade, nunca para criar perfis publicitários; seus logs são mantidos somente pelo tempo necessário à operação e à segurança do serviço.

## O que fica no seu computador

- As presenças instaladas, suas configurações e se estão ativadas.
- Sua atividade atual: título, plataforma, duração e endereço da capa.
- Um log de depuração com ações recentes e endereços de páginas suportadas que você visitou, útil quando algo não funciona.
- O log do app de desktop, `nowly-host.log`, na pasta de cache dele.
- Uma cópia local do seu nome e avatar no Discord, obtidos do aplicativo Discord para exibição na extensão.

Tudo isso é apagado quando você redefine ou desinstala a extensão, e você pode apagar o log do app de desktop quando quiser.

## As permissões, em linguagem simples

- **Acesso a sites**: um script leve verifica se a página que você abre pertence a uma plataforma suportada, para que o painel lateral possa sugerir a presença certa. Ele não envia seu histórico de navegação a lugar nenhum.
- **Scripts de usuário**: permitem que as presenças instaladas rodem nos respectivos sites. Veja [Por que o Nowly pede permissão para scripts de usuário](/guides/allow-user-scripts).
- **Mensagens nativas**: permitem que a extensão converse com o app de desktop no seu computador.
- **Armazenamento**: mantém suas configurações e presenças no navegador.

## O que pode chegar ao Nowly, somente se você escolher

- **Estatísticas de uso** ficam desativadas por padrão. Se você as ativar, a API do Nowly receberá um identificador aleatório de dispositivo, seu navegador, sistema, idioma e versões, além de eventos como instalações. Nunca suas páginas, títulos, buscas ou identidade no Discord.
- **Uma conta** é opcional. Se você entrar com o Discord, suas configurações e a lista de presenças instaladas serão sincronizadas entre navegadores. Sua atividade atual, abas e histórico nunca serão sincronizados.
- **Curtidas e relatos** enviados pela página de uma presença chegam à API do Nowly, inclusive o que você escreveu em um relato.
- **Baixar presenças** da biblioteca contata os servidores e a CDN do Nowly, como qualquer download.

## Seus dados, sob seu controle

- A página [Seus dados](/consent) permite ativar ou desativar estatísticas e exportar ou apagar tudo o que foi armazenado para seu dispositivo.
- A [página da conta](/account) permite baixar os dados da conta ou excluí-la.
- Desinstalar a extensão apaga tudo o que ela guardou localmente.

## O que o Discord faz com eles

Depois que sua atividade chega ao Discord, ele a mostra às pessoas autorizadas a ver seu perfil e a processa conforme sua própria política de privacidade. O Nowly não pode mudar essa parte, mas você pode escolher o que envia desde o começo: veja [Escolha exatamente o que o Discord mostra sobre você](/guides/control-what-discord-shows).
