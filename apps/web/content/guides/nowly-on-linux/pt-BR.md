---
title: "Nowly no Linux: .deb, arquivo compactado, Flatpak e Snap"
description: Instale o app de desktop do Nowly em qualquer distribuição, resolva o aviso persistente de atualização e faça a Rich Presence funcionar com Discord ou navegador instalado via Flatpak ou Snap.
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

O Nowly funciona no Linux como no Windows e no macOS: a extensão de navegador detecta sua atividade, e o app de desktop a transmite ao aplicativo Discord no mesmo computador. No Linux, porém, há algumas opções extras, e os pacotes executados em ambientes isolados podem atrapalhar. Este guia aborda a instalação em diferentes distribuições e as soluções para os problemas que usuários de Linux realmente encontram.

## Requisitos

- Uma distribuição de 64 bits (x64) com glibc 2.17 ou posterior, o que inclui todas as distribuições populares atuais.
- O aplicativo Discord para desktop, instalado pelo `.deb` do Discord, pelo arquivo oficial, pela sua distribuição, pelo Flatpak ou pelo Snap.
- Chrome, Chromium, Brave, Edge, Opera ou Firefox, preferencialmente instalado pelos repositórios da distribuição ou pelo pacote do fabricante.

## Escolha o download certo

A [página do app de desktop](/desktop) oferece dois arquivos para Linux:

- **O pacote `.deb`** para Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS e outros sistemas baseados no Debian. Ele instala o app para todos os usuários e o registra em todos os navegadores suportados.
- **O arquivo `.tar.gz`** para as demais distribuições, como Fedora, Arch e openSUSE. Ele contém o app e um script de instalação que o registra para seu usuário.

## Instale o pacote .deb

Na maioria dos ambientes gráficos, um clique duplo no arquivo abre um instalador de programas. Em alguns, como XFCE com Thunar, o clique duplo não faz nada se não houver um instalador gráfico de pacotes configurado. Nesse caso, instale pelo terminal:

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

Depois confira se o pacote foi realmente instalado:

```bash
dpkg -L nowly-host
```

A lista deve incluir `/usr/lib/nowly-client/nowly-host`. Reinicie o navegador por completo, não apenas a aba, para que ele encontre o novo app.

## Instale pelo arquivo compactado

Extraia o arquivo, abra um terminal na pasta extraída e execute o script de instalação incluído, seguindo as instruções que ele exibir. O script copia o app para sua pasta pessoal e cria os pequenos arquivos de manifesto que informam aos navegadores onde encontrá-lo, como `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json` para Chrome ou `~/.mozilla/native-messaging-hosts/nowly.client.json` para Firefox. Reinicie o navegador em seguida.

## "Atualização disponível" logo após a instalação

Se o painel lateral do Nowly disser que há uma atualização para o app de desktop mesmo depois de você instalar a versão mais recente, verifique estas duas causas na ordem:

1. **O `.deb` nunca foi instalado.** Execute `dpkg -L nowly-host`. Se o comando disser que o pacote não está instalado, instale-o pelo terminal como mostrado acima.
2. **Uma instalação antiga do seu usuário tem prioridade.** Se você usou o arquivo compactado antes de mudar para o `.deb`, o manifesto antigo na sua pasta pessoal ainda aponta para o app antigo. Remova-o:

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Depois feche completamente o navegador e abra-o de novo, para que ele inicie o app de desktop no novo local.

## Discord instalado via Flatpak ou Snap

As versões isoladas do Discord criam o socket de Rich Presence dentro da própria pasta isolada, em vez do local habitual. O app de desktop do Nowly procura `discord-ipc-0` até `discord-ipc-9` em `$XDG_RUNTIME_DIR`, `$TMPDIR` e `/tmp`, e pode não encontrar o Discord instalado via Flatpak ou Snap. Outras ferramentas de Rich Presence enfrentam o mesmo problema. A solução usual é criar um link simbólico do local esperado para o socket verdadeiro.

Para o **Discord do Flathub**, o socket fica em `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`. Crie o link com:

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

O conteúdo de `$XDG_RUNTIME_DIR` é apagado a cada reinicialização, e o link desaparece junto. Para recriá-lo automaticamente a cada login, deixe o systemd cuidar disso:

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

Para o **Discord da Snap Store**, o socket geralmente fica em `$XDG_RUNTIME_DIR/snap.discord/`. Um link do mesmo tipo funciona:

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Inicie o Discord antes de criar o link. Depois clique em **Verificar conexão** no painel lateral do Nowly.

## Navegador instalado via Flatpak ou Snap

O navegador inicia o app de desktop do Nowly por mensagens nativas. Navegadores instalados em ambientes isolados restringem os programas que podem iniciar; dependendo do pacote e de sua versão, as mensagens nativas podem ser inteiramente bloqueadas. O sintoma é a linha **Nowly Desktop detectado** que nunca fica verde, não importa o que você instale.

A solução confiável é usar um navegador instalado pelos repositórios da distribuição ou pelo pacote `.deb` ou `.rpm` do fabricante, em vez da versão Flatpak ou Snap. Seus favoritos e senhas voltam quando você entra na conta do navegador.

## Notificações e logs

Quando o Discord bloqueia a conexão por um problema de permissão, o app de desktop pode mostrar uma notificação por meio de `notify-send`, se seu ambiente gráfico tiver um serviço de notificações ativo.

O app de desktop grava seu log em `~/.cache/NowlyClient/nowly-host.log`. Ele pode conter a atividade enviada ao Discord; portanto, leia-o antes de compartilhá-lo em um ticket de suporte. Você pode apagá-lo quando quiser.

## Lista de verificação

- `dpkg -L nowly-host` lista o app, ou o script de instalação do arquivo compactado terminou sem erros.
- Não há manifesto antigo de uma instalação anterior.
- O Discord está em execução, e seu socket pode ser acessado por `$XDG_RUNTIME_DIR` ou `/tmp`.
- O navegador não foi instalado via Flatpak ou Snap, ou as mensagens nativas funcionam nele.

Se todas as quatro condições forem verdadeiras e o Nowly ainda não alcançar o Discord, siga a [lista de solução de problemas](/guides/rich-presence-not-showing) e abra um ticket no servidor do Nowly no Discord, informando sua distribuição, ambiente gráfico e como instalou o Discord e o navegador.
