import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";

const LOCALES = [
  "de",
  "el",
  "en",
  "es",
  "fr",
  "ja",
  "ko",
  "ms",
  "pl",
  "pt-BR",
  "tr",
];
const WIDTHS = [400, 480, 360, 320];
const SCREEN_WIDTH = 1280;
const BASE_URL = "http://127.0.0.1:43987";
const OUTPUT =
  process.env.IDLE_CARD_CAPTURE_DIR ??
  "/tmp/opencode/opencode/idle-card-buttons-stacked";

export default async ({
  page,
  context,
  worker,
  extensionId,
  shot,
  key,
  sleep,
}) => {
  const server = createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(
        "<!doctype html><title>Nowly local layout verification</title><h1>Idle Activity card regression</h1>",
      );
    } else {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ items: [] }));
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(43987, "127.0.0.1", resolve);
  });

  try {
    await context.route(/^https?:\/\//, (route) =>
      route.request().url().startsWith(BASE_URL)
        ? route.continue()
        : route.abort(),
    );
    await worker.evaluate(async (baseUrl) => {
      const now = Date.now();
      await chrome.storage.local.set({
        settings: {
          appearance: "light",
          seasonalThemes: false,
          customApiBaseUrl: baseUrl,
        },
        onboarding: {
          onboardingCompleted: true,
          devReplayOnboarding: false,
          nativeSeenConnectedOnce: true,
        },
        localePreference: "fr",
        sidepanelActiveView: "activity",
        analyticsConsent: false,
        featureReveals: {
          announcements: now,
          "custom-activity": now,
          "account-sync": now,
        },
        legalDocuments: {
          manifest: {
            schemaVersion: 1,
            documents: {
              tos: {
                version: 2,
                requiredVersion: 1,
                updatedAt: "2026-10-24",
                path: "/tos",
              },
              privacy: {
                version: 1,
                requiredVersion: 1,
                updatedAt: "2026-10-16",
                path: "/privacy",
              },
            },
          },
          tosAcceptance: {
            version: 2,
            recordedAt: new Date(now).toISOString(),
          },
          privacyAcknowledgement: {
            version: 1,
            recordedAt: new Date(now).toISOString(),
          },
          checkedAt: now,
          checkFailed: false,
        },
      });
    }, BASE_URL);
    await page.goto(BASE_URL);
    await key("ctrl+shift+y");
    await sleep(1500);

    const session = await context.newCDPSession(page);
    const { targetInfos } = await session.send("Target.getTargets");
    const target = targetInfos.find((candidate) =>
      candidate.url.startsWith(`chrome-extension://${extensionId}/sidepanel/`),
    );
    if (!target) throw new Error("Native Chrome sidepanel was not opened");
    const { sessionId } = await session.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: false,
    });
    let commandId = 0;
    const command = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++commandId;
        const receive = (event) => {
          if (event.sessionId !== sessionId) return;
          const message = JSON.parse(event.message);
          if (message.id !== id) return;
          session.off("Target.receivedMessageFromTarget", receive);
          if (message.error) reject(new Error(message.error.message));
          else resolve(message.result);
        };
        session.on("Target.receivedMessageFromTarget", receive);
        session
          .send("Target.sendMessageToTarget", {
            sessionId,
            message: JSON.stringify({ id, method, params }),
          })
          .catch(reject);
      });
    const evaluate = async (expression) => {
      const result = await command("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (result.exceptionDetails)
        throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result?.value;
    };
    const wait = (condition) =>
      evaluate(
        `new Promise((resolve,reject)=>{const start=Date.now();const timer=setInterval(()=>{if(${condition}){clearInterval(timer);resolve(true);}else if(Date.now()-start>10000){clearInterval(timer);reject(new Error('Timed out waiting for card'));}},40);})`,
      );
    await command("Page.enable");
    await command("Page.addScriptToEvaluateOnNewDocument", {
      source: `(()=>{const send=chrome.runtime.sendMessage.bind(chrome.runtime);globalThis.idleCardMessages=[];chrome.runtime.sendMessage=(message,...args)=>{idleCardMessages.push(message.type);if(message.type==='GET_NATIVE_STATUS'||message.type==='CONNECT_NATIVE')return Promise.resolve({connected:false,discordConnected:false,status:'Specified native messaging host not found.'});return send(message,...args);};})()`,
    });
    await command("Page.reload");
    await wait("document.querySelector('button')");
    await evaluate(
      `(()=>{const consent=Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Accepter et continuer');if(consent){for(const input of document.querySelectorAll('input[type="checkbox"]'))if(!input.checked)input.click();for(const checkbox of document.querySelectorAll('[role="checkbox"]'))if(checkbox.getAttribute('aria-checked')!=='true')checkbox.click();consent.click();}})()`,
    );
    try {
      await wait(
        "Array.from(document.querySelectorAll('button')).some(button=>button.textContent==='Télécharger Nowly Desktop')",
      );
    } catch (error) {
      await shot("failure-initial-card");
      console.log(await evaluate("document.body.innerText"));
      throw error;
    }
    await evaluate("document.fonts.ready");
    await shot("00-native-panel-before-resize");

    const resize = async (width) => {
      await command("Emulation.clearDeviceMetricsOverride");
      if (width < 360) {
        const height = await evaluate("innerHeight");
        await command("Emulation.setDeviceMetricsOverride", {
          width,
          height,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await sleep(250);
        if ((await evaluate("innerWidth")) !== width)
          throw new Error(`Sidepanel emulation failed at ${width}`);
        return;
      }
      for (const offset of [9, 1, 5, 13, 17, 21, 25, 29]) {
        const previous = await evaluate("innerWidth");
        if (Math.abs(previous - width) <= 1) return;
        execFileSync("xdotool", [
          "mousemove",
          String(SCREEN_WIDTH - previous - offset),
          "380",
          "mousedown",
          "1",
          "mousemove",
          "--sync",
          String(SCREEN_WIDTH - width - offset),
          "380",
          "mouseup",
          "1",
        ]);
        await sleep(250);
      }
      const actual = await evaluate("innerWidth");
      if (Math.abs(actual - width) > 1)
        throw new Error(
          `Native sidepanel resize failed: expected ${width}, got ${actual}`,
        );
    };

    const results = [];
    for (const locale of LOCALES) {
      const dictionary = JSON.parse(
        readFileSync(`apps/extension/messages/${locale}.json`, "utf8"),
      );
      await worker.evaluate(
        (locale) => chrome.storage.local.set({ localePreference: locale }),
        locale,
      );
      await command("Page.reload");
      await wait(
        `document.documentElement.lang===${JSON.stringify(locale)}&&Array.from(document.querySelectorAll('button')).some(button=>button.textContent===${JSON.stringify(dictionary["action.downloadApp"])})`,
      );
      await evaluate("document.fonts.ready");
      for (const width of WIDTHS) {
        await resize(width);
        const geometry = await evaluate(`(()=>{
          const labels=${JSON.stringify([dictionary["action.downloadApp"], dictionary["action.retry"]])};
          const buttons=labels.map(label=>Array.from(document.querySelectorAll('button')).find(button=>button.textContent===label));
          const actions=buttons[0].parentElement;
          const card=actions.parentElement;
          const rect=node=>{const {x,y,left,right,top,bottom,width,height}=node.getBoundingClientRect();return {x,y,left,right,top,bottom,width,height};};
          const bounds=rect(card);
          const cardStyle=getComputedStyle(card);
          const contentLeft=bounds.left+parseFloat(cardStyle.borderLeftWidth)+parseFloat(cardStyle.paddingLeft);
          const contentRight=bounds.right-parseFloat(cardStyle.borderRightWidth)-parseFloat(cardStyle.paddingRight);
          return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,card:bounds,contentLeft,contentRight,cardScrollWidth:card.scrollWidth,cardClientWidth:card.clientWidth,actions:rect(actions),buttons:buttons.map(button=>{
            const style=getComputedStyle(button);
            const walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
            const textRects=[];
            while(walker.nextNode()){const range=document.createRange();range.selectNodeContents(walker.currentNode);textRects.push(...Array.from(range.getClientRects()).map(rect=>({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom})));}
            return {label:button.textContent,rect:rect(button),scrollWidth:button.scrollWidth,clientWidth:button.clientWidth,textRects,whiteSpace:style.whiteSpace,overflow:style.overflow,textOverflow:style.textOverflow};
          })};
        })()`);
        if (
          Math.abs(geometry.actions.left - geometry.contentLeft) > 1 ||
          Math.abs(geometry.actions.right - geometry.contentRight) > 1
        )
          throw new Error(
            `Actions do not fill card content in ${locale}/${width}`,
          );
        if (
          geometry.documentWidth > geometry.viewport ||
          geometry.cardScrollWidth > geometry.cardClientWidth
        )
          throw new Error(
            `Horizontal scroll in ${locale}/${width}: ${JSON.stringify(geometry)}`,
          );
        for (const button of geometry.buttons) {
          const rect = button.rect;
          if (
            rect.left < geometry.card.left ||
            rect.right > geometry.card.right + 1 ||
            rect.left < 0 ||
            rect.right > geometry.viewport + 1 ||
            button.scrollWidth > button.clientWidth + 1 ||
            button.whiteSpace !== "normal" ||
            button.overflow === "hidden" ||
            button.textOverflow === "ellipsis"
          )
            throw new Error(
              `Overflow or clipped label in ${locale}/${width}: ${JSON.stringify(button)}`,
            );
          if (
            button.textRects.some(
              (text) =>
                text.left < rect.left ||
                text.right > rect.right + 1 ||
                text.top < rect.top ||
                text.bottom > rect.bottom + 1,
            )
          )
            throw new Error(
              `Text outside button in ${locale}/${width}: ${JSON.stringify(button)}`,
            );
          if (rect.height < 36)
            throw new Error(
              `Button lost minimum target height in ${locale}/${width}`,
            );
          if (
            Math.abs(rect.width - geometry.actions.width) > 1 ||
            Math.abs(rect.left - geometry.actions.left) > 1 ||
            Math.abs(rect.right - geometry.actions.right) > 1
          )
            throw new Error(
              `Button is not full-width in ${locale}/${width}: ${JSON.stringify(button)}`,
            );
        }
        const [download, retry] = geometry.buttons;
        if (
          download.rect.right > retry.rect.left &&
          download.rect.bottom > retry.rect.top
        )
          throw new Error(`Overlapping actions in ${locale}/${width}`);
        if (Math.abs(retry.rect.top - download.rect.bottom - 8) > 1)
          throw new Error(
            `Retry must be below download with an 8px gap in ${locale}/${width}`,
          );
        results.push({
          locale,
          width,
          emulatedBelowNativeMinimum: width < 360,
          geometry,
        });
        if (locale === "fr" && width !== 480)
          await shot(`fr-no-host-stacked-${width}`);
      }
    }

    await worker.evaluate(() =>
      chrome.storage.local.set({ localePreference: "fr" }),
    );
    await command("Page.reload");
    await wait(
      "Array.from(document.querySelectorAll('button')).some(button=>button.textContent==='Réessayer')",
    );
    const retryMessages = await evaluate(
      `(async()=>{idleCardMessages.length=0;Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Réessayer').click();await new Promise(resolve=>setTimeout(resolve,100));return idleCardMessages;})()`,
    );
    const retryIndex = retryMessages.indexOf("CONNECT_NATIVE");
    if (retryIndex < 0 || retryMessages[retryIndex + 1] !== "GET_NATIVE_STATUS")
      throw new Error(`Retry wiring changed: ${JSON.stringify(retryMessages)}`);

    writeFileSync(
      join(OUTPUT, "layout-results.json"),
      JSON.stringify(
        {
          nativeSidepanel: true,
          results,
          retryMessages,
        },
        null,
        2,
      ),
    );
    console.log(
      `PASS: ${results.length} real extension sidepanel locale/width layouts, full-width stacked buttons, complete labels, an 8px vertical gap and retry wiring. Chrome's native minimum is 360px; 320px uses CDP viewport emulation in that native target.`,
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
};
