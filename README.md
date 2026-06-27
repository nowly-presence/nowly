<div align="center">

<img src="https://cdn.nowly.me/assets/app_title.png" height="94" alt="Nowly" />

Open-source Discord Rich Presence for the modern web.

Automatically display what you're watching, listening to, reading, or doing on Discord.

</div>

---

## About

Nowly is an open-source alternative to PreMiD.

It detects activity from supported websites and updates your Discord Rich Presence through a lightweight local host.

No activity data is sent to external servers.

---

## Repositories

| Repository | Description |
|------------|-------------|
| [`nowly`](https://github.com/nowly-presence/nowly) | Main project, website and ecosystem |
| [`presences`](https://github.com/nowly-presence/presences) | Community-maintained website integrations |
| [`sdk`](https://github.com/nowly-presence/sdk) | Type-safe SDK for building presences |
| [`cli`](https://github.com/nowly-presence/cli) | Official CLI |
| `internal-cli` | Internal release & publishing tools |

---

## Architecture

```text
Website -> Browser Extension
             └──> Nowly Host -> Discord Desktop
```

---

## Getting Started

Install the browser extension from the Chrome Web Store.

Developers interested in creating presences should start here:

- SDK → `nowly-presence/sdk`
- CLI → `nowly-presence/cli`
- Presences → `nowly-presence/presences`

---

## Contributing

Contributions are welcome.

Please open issues and pull requests in the repository related to the component you're modifying.

---

## Supporters

Nowly is free and always will be. If you want to support the project, you can do it on [Ko-fi](https://ko-fi.com/qkimi_).

<!-- supporters:start -->
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AnastasisArt">
        <img src="https://github.com/AnastasisArt.png?size=96" width="64" height="64" alt="AnastasisArt" />
        <br />
        <sub><b>AnastasisArt</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/mo-gd">
        <img src="https://github.com/mo-gd.png?size=96" width="64" height="64" alt="mo-gd" />
        <br />
        <sub><b>mo-gd</b></sub>
      </a>
    </td>
    <td align="center">
      <img src="https://ko-fi.com/img/anon9.png?v=11" width="64" height="64" alt="Topinambour" />
      <br />
      <sub><b>Topinambour</b></sub>
    </td>
    <td align="center">
      <a href="https://github.com/Galadou">
        <img src="https://github.com/Galadou.png?size=96" width="64" height="64" alt="Galadou" />
        <br />
        <sub><b>Galadou</b></sub>
      </a>
    </td>
  </tr>
</table>
<!-- supporters:end -->

Thank you to all of our supporters 💕

---

## License

[BUSL-1.1](./LICENSE)
