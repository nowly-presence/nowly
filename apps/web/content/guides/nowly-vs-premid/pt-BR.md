---
title: "Nowly x PreMiD: uma comparação honesta"
description: Ambos mostram atividades de sites no Discord. Compare configuração, catálogo, privacidade, segurança e licença para escolher a melhor opção para as plataformas que você usa.
category: discord
order: 3
updated: 2026-10-09
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

Se você procura uma maneira de mostrar no Discord o que assiste no navegador, logo encontrará dois nomes: PreMiD, projeto comunitário de longa data, e Nowly, uma alternativa mais recente. Ambos resolvem o mesmo problema com uma estrutura básica semelhante; a escolha depende dos detalhes. Esta comparação busca ser justa, inclusive nos pontos em que o PreMiD está à frente.

Os dois projetos mudam rapidamente. As informações abaixo correspondem ao momento em que este texto foi escrito; consulte o site de cada projeto para saber o que há de mais recente.

## O que eles têm em comum

- **A mesma arquitetura.** Uma extensão de navegador lê a página, e um pequeno app no computador envia a atividade ao aplicativo Discord para desktop por meio de uma conexão local. Nenhum dos dois funciona com o Discord em uma aba do navegador ou no celular.
- **Integrações por site.** Ambos as chamam de presenças: um script para cada plataforma, escrito pela comunidade, que sabe o que ler naquele site.
- **Uso gratuito.** Nenhum cobra pela extensão, pelo app de desktop ou pelas presenças.

## Onde o PreMiD está à frente

- **Tamanho do catálogo.** O PreMiD existe há anos, e sua comunidade criou presenças para centenas de sites, inclusive muitos de nicho. Hoje, a biblioteca do Nowly tem mais de 40 plataformas, concentradas nas mais usadas.
- **Maturidade e comunidade.** Anos de uso permitiram descobrir e corrigir muitos casos específicos, além de reunir uma grande comunidade de autores de presenças.

Se a plataforma que importa para você só existe na loja do PreMiD, ele é simplesmente a melhor escolha.

## Em que o Nowly se concentra

- **Presenças assinadas.** A equipe assina cada presença oficial do Nowly com uma chave ECDSA P-256, e a extensão confere a assinatura e os hashes antes de executá-la. Scripts modificados são recusados.
- **Privacidade por padrão.** A atividade de navegação fica desativada por padrão na maioria das presenças; várias oferecem modo de privacidade, conversas temporárias do ChatGPT ficam ocultas e as estatísticas de uso só são ativadas se você quiser. Leia [O que o Nowly pode ver](/guides/what-nowly-can-see).
- **Controle no dia a dia.** Um atalho para pausar tudo, abas ocultas, pausas temporárias de algumas horas por presença e agendamentos individuais. Veja [Escolha exatamente o que o Discord mostra sobre você](/guides/control-what-discord-shows).
- **Diagnóstico integrado.** O painel lateral verifica cada elo da cadeia separadamente (extensão, scripts de usuário, app de desktop, Discord, presença e atividade), para você saber onde agir.
- **Interface em painel lateral e idiomas.** A extensão funciona no painel lateral do navegador, e tanto a interface quanto o site estão disponíveis em 11 idiomas.
- **App de desktop para Windows, macOS e Linux**, com pacote `.deb` e arquivo compactado para outras distribuições.
- **Sincronização opcional por conta.** Entre com o Discord somente se quiser ter suas presenças e configurações em vários navegadores.

## Licença

O código do PreMiD é aberto. As presenças do Nowly têm código aberto sob a licença MIT, e seu SDK e CLI têm documentação para colaboradores. O código principal do Nowly é público no GitHub sob a Business Source License 1.1, uma licença com código disponível para consulta: você pode ler e auditar o código, mas ela não é uma licença de código aberto aprovada pela OSI. Vale conhecer essa distinção se ela for importante para você.

## Qual escolher?

- **Sua plataforma só está no PreMiD:** use o PreMiD.
- **Suas plataformas estão nos dois:** experimente o Nowly se presenças assinadas, privacidade por padrão e controle detalhado forem importantes para você; continue no PreMiD se ele já atende às suas necessidades.
- **Você quer usar os dois para plataformas diferentes:** é possível, mas tenha cuidado. Duas ferramentas que atualizam sua atividade no Discord ao mesmo tempo podem substituir ou apagar o status uma da outra. Deixe cada plataforma sob responsabilidade de apenas uma ferramenta e desative a outra enquanto testa.

## Como migrar do PreMiD para o Nowly

1. Feche o app de desktop do PreMiD e desative sua extensão de navegador para que ele pare de atualizar sua atividade.
2. Siga [Como configurar o Nowly](/guides/set-up-nowly): extensão, scripts de usuário, app de desktop e Discord.
3. Instale pela [biblioteca](/library) as presenças que substituem as que você usava.
4. Confira o diagnóstico no painel lateral e depois seu perfil no Discord.

Se alguma plataforma que você usava no PreMiD não estiver na biblioteca, sugira-a pela [página de suporte](/support): novas presenças são adicionadas regularmente, e qualquer pessoa pode criar uma seguindo o [guia para desenvolvedores](/guides/create-your-first-presence).
