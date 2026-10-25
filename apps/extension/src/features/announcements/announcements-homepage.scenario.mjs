import { createServer } from "node:http";
import { readFileSync } from "node:fs";

export default async ({
  page,
  context,
  worker,
  extensionId,
  shot,
  key,
  click: nativeClick,
  sleep,
}) => {
  const now = Date.now();
  const release = readFileSync(
    "packages/changelog/content/2-4-0/fr-FR.mdx",
    "utf8",
  )
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .trim();
  const items = [
    {
      id: "homepage-maintenance",
      kind: "maintenance",
      pinned: true,
      endsAt: new Date(now + 45 * 60_000).toISOString(),
      translations: {
        fr: {
          title: "Un peu d’attention pour Nowly",
          description:
            "Nous améliorons la bibliothèque. Vos activités enregistrées continuent de fonctionner.",
          content:
            "## Vos activités restent disponibles\n\nNous mettons à jour la bibliothèque. **Vos activités enregistrées ne sont pas affectées.**",
        },
      },
    },
    {
      id: "homepage-release",
      source: "changelog",
      kind: "normal",
      translations: {
        fr: {
          title: "2.4.0",
          description:
            "Créez et partagez vos activités Discord avec des modèles, images, minuteries et boutons.",
          content: release,
        },
      },
    },
    {
      id: "homepage-incident",
      kind: "warning",
      severity: 3,
      translations: {
        fr: {
          title: "Bibliothèque temporairement indisponible",
          description:
            "Vos activités enregistrées restent disponibles. Nous surveillons le service.",
          content:
            "## Vos activités locales ne sont pas affectées\n\nNous examinons le problème.\n\n[État des services](https://nowly.me/status)",
        },
      },
    },
  ].map((item) => ({
    source: "announcement",
    pinned: false,
    severity: null,
    startsAt: null,
    endsAt: null,
    expiresAt: null,
    publishedAt: new Date(now - 60_000).toISOString(),
    updatedAt: new Date(now - 60_000).toISOString(),
    ...item,
  }));
  const backgroundFixtures = [
    {
      kind: "normal",
      severity: null,
      title: "Les nouvelles de Nowly",
      token: "--surface",
      hoverToken: "--neutral",
      capture: "84-fr-homepage-normal-neutral-background",
    },
    {
      kind: "maintenance",
      severity: null,
      title: "Un peu d’attention pour Nowly",
      token: "--primary-soft",
      hoverToken: "--primary-soft-hover",
      capture: "80-fr-homepage-maintenance-primary-background",
    },
    {
      kind: "warning",
      severity: 1,
      title: "Un point d’attention pour la bibliothèque",
      token: "--announcement-warning-low-soft",
      hoverToken: "--announcement-warning-low-soft-hover",
      capture: "81-fr-homepage-warning1-yellow-background",
    },
    {
      kind: "warning",
      severity: 2,
      title: "Les téléchargements peuvent être ralentis",
      token: "--announcement-warning-medium-soft",
      hoverToken: "--announcement-warning-medium-soft-hover",
      capture: "82-fr-homepage-warning2-orange-background",
    },
    {
      kind: "warning",
      severity: 3,
      title: "Bibliothèque temporairement indisponible",
      token: "--error-soft",
      hoverToken: "--error-soft-hover",
      capture: "83-fr-homepage-warning3-red-background",
    },
  ];
  const server = createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    if (request.url.startsWith("/announcements/events")) {
      response.writeHead(200, { "content-type": "text/event-stream" });
      response.write("event: invalidate\ndata: {}\n\n");
    } else if (request.url.startsWith("/announcements")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ items }));
    } else if (request.url.startsWith("/fixture-background/")) {
      const fixture = backgroundFixtures[Number(request.url.split("/").at(-1))];
      if (!fixture) {
        response.writeHead(404);
        response.end();
        return;
      }
      Object.assign(items[0], {
        kind: fixture.kind,
        severity: fixture.severity,
        updatedAt: new Date().toISOString(),
      });
      items[0].translations.fr.title = fixture.title;
      response.end("ok");
    } else {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(
        "<!doctype html><title>Nowly local verification</title><h1>Nowly extension verification</h1><p>Local sample notices only. No production publication.</p>",
      );
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await worker.evaluate(async (baseUrl) => {
      const now = Date.now();
      await chrome.storage.local.set({
        settings: {
          appearance: "light",
          seasonalThemes: false,
          customApiBaseUrl: baseUrl,
          dockLayout: [
            ["activity", "store", "custom", "announcements", "settings"],
          ],
        },
        onboarding: {
          onboardingCompleted: false,
          devReplayOnboarding: false,
          nativeSeenConnectedOnce: true,
        },
        localePreference: "fr",
        sidepanelActiveView: "activity",
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
    }, baseUrl);
    const setup = await context.newPage();
    await setup.goto(`chrome-extension://${extensionId}/sidepanel/index.html`);
    await setup.evaluate(
      (baseUrl) =>
        chrome.runtime.sendMessage({
          source: "PRESENCES_POPUP",
          type: "SET_SETTINGS",
          payload: { customApiBaseUrl: baseUrl },
        }),
      baseUrl,
    );
    await sleep(1000);
    for (const checkbox of await setup.getByRole("checkbox").all())
      await checkbox.press("Space");
    const consent = setup
      .getByRole("button")
      .filter({ hasText: /Accepter et continuer|Accept and continue/ });
    if (await consent.count()) await consent.click();
    await setup.close();
    await page.goto(baseUrl);
    await key("ctrl+shift+y");
    await sleep(1800);
    const session = await context.newCDPSession(page);
    const targets = await session.send("Target.getTargets");
    const target = targets.targetInfos.find(
      (candidate) =>
        candidate.url.includes(extensionId) &&
        candidate.url.includes("/sidepanel/"),
    );
    if (!target) throw new Error("Native sidepanel target not found");
    const { sessionId } = await session.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: false,
    });
    let commandId = 0;
    const command = async (method, params = {}) => {
      const id = ++commandId;
      const result = await new Promise((resolve, reject) => {
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
            message: JSON.stringify({
              id,
              method,
              params,
            }),
          })
          .catch(reject);
      });
      return result;
    };
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
        `new Promise((resolve,reject)=>{const started=Date.now();const timer=setInterval(()=>{if(${condition}){clearInterval(timer);resolve(true);}else if(Date.now()-started>10000){clearInterval(timer);reject(new Error('UI condition timed out: '+${JSON.stringify(condition)}));}},40);})`,
      );
    const click = (selector) =>
      evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const assertNoBanner = async () => {
      if (
        await evaluate(
          "Boolean(document.querySelector('aside a[href=\"#announcements\"]'))",
        )
      )
        throw new Error("Banner visible outside homepage");
    };
    const back = () =>
      click('main [aria-hidden="false"] button[aria-label="Retour"]');
    const assertDateOnly = async (selector, detail) => {
      const result = await evaluate(
        `(()=>{const root=document.querySelector(${JSON.stringify(selector)});const date=root.querySelector('time');return {text:root.innerText,date:date?.dateTime,size:date&&getComputedStyle(date).fontSize,icons:root.querySelectorAll('.announcement-accent,[data-tone]').length+(date?.parentElement.querySelectorAll('svg').length??0),aside:Boolean(document.querySelector('aside a[href="#announcements"]'))};})()`,
      );
      if (
        !result.date ||
        result.icons ||
        result.aside ||
        /Notes de version|Avertissement \(niveau|Annonce épinglée/.test(
          result.text,
        )
      )
        throw new Error(`Redundant metadata: ${JSON.stringify(result)}`);
      if (detail && result.size !== "9px")
        throw new Error(`Detail date size ${result.size}, expected 9px`);
    };
    const seasons = [
      "spring",
      "summer",
      "autumn",
      "winter",
      "halloween",
      "new-year",
    ];
    const settleStyles = () =>
      evaluate(
        `document.fonts.ready.then(()=>new Promise((resolve,reject)=>{let prior='',stable=0,frames=0;const sample=()=>{const root=document.documentElement;const link=document.querySelector('aside a[href="#announcements"]');const style=getComputedStyle(link??document.body);const signature=JSON.stringify([root.className,getComputedStyle(root).getPropertyValue('--primary'),style.backgroundColor,style.color]);stable=signature===prior?stable+1:0;prior=signature;if(stable>=5){resolve(true);return;}if(++frames>120){reject(new Error('Computed colors did not settle'));return;}requestAnimationFrame(sample);};requestAnimationFrame(sample);}))`,
      );
    const applyTheme = async (dark, season) => {
      await evaluate(
        `(()=>{const root=document.documentElement;root.classList.toggle('dark',${dark});for(const value of ${JSON.stringify(seasons)})root.classList.toggle('season-'+value,value===${JSON.stringify(season)});})()`,
      );
      await settleStyles();
    };
    const capture = async (name, season = "") => {
      await evaluate(
        `(async()=>{await chrome.storage.local.set({seasonOverride:${JSON.stringify(season || "none")}});await chrome.runtime.sendMessage({source:'PRESENCES_POPUP',type:'SET_SETTINGS',payload:{appearance:'light',seasonalThemes:${Boolean(season)}}});})()`,
      );
      await applyTheme(false, season);
      await command("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: 0,
        y: 700,
      });
      await settleStyles();
      const snapshot = () =>
        evaluate(
          `chrome.storage.local.get('settings').then(({settings})=>{const root=document.documentElement;const link=document.querySelector('aside a[href="#announcements"]');return {classes:root.className,primary:getComputedStyle(root).getPropertyValue('--primary').trim(),background:link&&getComputedStyle(link).backgroundColor,color:link&&getComputedStyle(link).color,title:link?.textContent??null,appearance:settings.appearance,seasonalThemes:settings.seasonalThemes};})`,
        );
      const before = await snapshot();
      const expectedPrimary = season === "spring" ? "#2c7546" : "#0891b2";
      if (
        before.primary !== expectedPrimary ||
        before.appearance !== "light" ||
        before.seasonalThemes !== Boolean(season) ||
        before.classes.includes("dark") ||
        seasons.some(
          (value) =>
            before.classes.includes("season-" + value) !== (value === season),
        )
      )
        throw new Error(`Capture theme mismatch: ${JSON.stringify(before)}`);
      await shot(name);
      await settleStyles();
      const after = await snapshot();
      if (JSON.stringify(before) !== JSON.stringify(after))
        throw new Error(
          `Capture colors changed during shot ${name}: ${JSON.stringify({ before, after })}`,
        );
      console.log(`CAPTURE ${name}: stable ${JSON.stringify(after)}`);
    };

    await wait(`document.querySelector('[aria-label="Étape 1 sur 5"]')`);
    await assertNoBanner();
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Commencer').click()`,
    );
    await wait(`document.querySelector('[aria-label="Étape 2 sur 5"]')`);
    await assertNoBanner();
    const incomplete = await worker.evaluate(
      async () => (await chrome.storage.local.get("onboarding")).onboarding,
    );
    if (incomplete.onboardingCompleted || incomplete.devReplayOnboarding)
      throw new Error("Banner-free onboarding changed completion/replay state");
    await capture("89-fr-onboarding-no-banner");
    await worker.evaluate(async () => {
      const { onboarding } = await chrome.storage.local.get("onboarding");
      await chrome.storage.local.set({
        onboarding: { ...onboarding, onboardingCompleted: true },
      });
    });
    await wait(`document.querySelector('aside a[href="#announcements"]')`);
    const compact = await evaluate(
      `(()=>{const aside=document.querySelector('aside');const link=aside.querySelector('a');return {links:aside.querySelectorAll('a').length,buttons:aside.querySelectorAll('button').length,expanded:aside.querySelectorAll('[aria-expanded],[aria-controls]').length,body:aside.querySelectorAll('p,time').length,top:aside.getBoundingClientRect().top,height:aside.getBoundingClientRect().height,mainTop:document.querySelector('main').getBoundingClientRect().top,border:getComputedStyle(link).borderWidth,outline:getComputedStyle(link).outlineStyle,shadow:getComputedStyle(link).boxShadow,color:getComputedStyle(link).color,iconColors:Array.from(link.querySelectorAll('svg')).map(icon=>getComputedStyle(icon).color),width:innerWidth,viewportHeight:innerHeight};})()`,
    );
    if (
      compact.links !== 1 ||
      compact.buttons !== 0 ||
      compact.expanded !== 0 ||
      compact.body !== 0 ||
      compact.top !== 0 ||
      compact.height > 44 ||
      compact.mainTop < compact.height ||
      compact.border !== "0px" ||
      compact.outline !== "none" ||
      compact.shadow !== "none" ||
      compact.iconColors.some((color) => color !== compact.color)
    )
      throw new Error(`Invalid homepage strip: ${JSON.stringify(compact)}`);
    await command("DOM.enable");
    await command("CSS.enable");
    const measureBackground = (token) => {
      const link = document.querySelector('aside a[href="#announcements"]');
      const style = getComputedStyle(link);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      const color = (value) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data).map(
          (value) => value / 255,
        );
      };
      const composite = (front, back) => [
        ...front
          .slice(0, 3)
          .map(
            (value, index) => value * front[3] + back[index] * (1 - front[3]),
          ),
        1,
      ];
      const ancestors = [];
      for (let node = link; node; node = node.parentElement)
        ancestors.unshift(node);
      const background = ancestors.reduce(
        (back, node) =>
          composite(color(getComputedStyle(node).backgroundColor), back),
        [1, 1, 1, 1],
      );
      const rawColor = color(style.backgroundColor);
      const foreground = color(style.color);
      const luminance = (rgb) =>
        rgb
          .slice(0, 3)
          .reduce(
            (sum, value, index) =>
              sum +
              [0.2126, 0.7152, 0.0722][index] *
                (value <= 0.04045
                  ? value / 12.92
                  : ((value + 0.055) / 1.055) ** 2.4),
            0,
          );
      const values = [luminance(foreground), luminance(background)].sort(
        (a, b) => a - b,
      );
      const expected = color(
        getComputedStyle(document.documentElement)
          .getPropertyValue(token)
          .trim(),
      );
      return {
        color: style.color,
        rawBackground: style.backgroundColor,
        background,
        contrast: (values[1] + 0.05) / (values[0] + 0.05),
        mapped: rawColor.every(
          (value, index) => Math.abs(value - expected[index]) < 0.005,
        ),
        spans: link.querySelectorAll("span").length,
        decorativeSpans: link.querySelectorAll('span[aria-hidden="true"]')
          .length,
        arrows: link.querySelectorAll("svg").length,
        arrowColor: getComputedStyle(link.querySelector("svg")).color,
        primary: getComputedStyle(document.documentElement)
          .getPropertyValue("--primary")
          .trim(),
      };
    };
    const selectFixture = async (index) => {
      const fixture = backgroundFixtures[index];
      await fetch(`${baseUrl}/fixture-background/${index}`);
      await evaluate(
        `chrome.runtime.sendMessage({source:'PRESENCES_POPUP',type:'REFRESH_ANNOUNCEMENTS',payload:{locale:'fr'}})`,
      );
      await wait(
        `document.querySelector('aside a')?.textContent.includes(${JSON.stringify(fixture.title)})`,
      );
    };
    const assertBackground = (measurement, label) => {
      if (
        !measurement.mapped ||
        measurement.contrast < 4.5 ||
        measurement.spans !== 1 ||
        measurement.decorativeSpans !== 0 ||
        measurement.arrows !== 1 ||
        measurement.arrowColor !== measurement.color
      )
        throw new Error(
          `Invalid banner background ${label}: ${JSON.stringify(measurement)}`,
        );
    };
    const measurements = [];
    for (const [index, fixture] of backgroundFixtures.entries()) {
      await selectFixture(index);
      const documentNode = await command("DOM.getDocument");
      const { nodeId } = await command("DOM.querySelector", {
        nodeId: documentNode.root.nodeId,
        selector: 'aside a[href="#announcements"]',
      });
      for (const dark of [false, true]) {
        for (const season of ["", ...seasons]) {
          await applyTheme(dark, season);
          for (const hover of [false, true]) {
            await command("CSS.forcePseudoState", {
              nodeId,
              forcedPseudoClasses: hover ? ["hover"] : [],
            });
            await settleStyles();
            const measurement = await evaluate(
              `(${measureBackground.toString()})(${JSON.stringify(hover ? fixture.hoverToken : fixture.token)})`,
            );
            assertBackground(
              measurement,
              `${fixture.kind}/${fixture.severity} dark=${dark} season=${season} hover=${hover}`,
            );
            measurements.push({
              kind: fixture.kind,
              severity: fixture.severity,
              dark,
              season,
              hover,
              ...measurement,
            });
          }
        }
      }
      await command("CSS.forcePseudoState", {
        nodeId,
        forcedPseudoClasses: [],
      });
    }
    for (const dark of [false, true])
      for (const season of ["", ...seasons])
        for (const hover of [false, true]) {
          const group = measurements.filter(
            (value) =>
              value.dark === dark &&
              value.season === season &&
              value.hover === hover,
          );
          const warnings = group.filter((value) => value.kind === "warning");
          const normal = group.find((value) => value.kind === "normal");
          const maintenance = group.find(
            (value) => value.kind === "maintenance",
          );
          if (
            new Set(warnings.map((value) => JSON.stringify(value.background)))
              .size !== 3 ||
            JSON.stringify(normal.background) ===
              JSON.stringify(maintenance.background) ||
            (!season &&
              new Set(group.map((value) => JSON.stringify(value.background)))
                .size !== backgroundFixtures.length)
          )
            throw new Error(
              `Background mappings are not distinct: dark=${dark} season=${season} hover=${hover}`,
            );
        }
    console.log(
      `PASS: ${measurements.length} text/banner contrast measurements including hover, light/dark and all seasonal themes; minimum ${Math.min(...measurements.map((value) => value.contrast)).toFixed(2)}:1. Three distinct warning backgrounds in every theme/state, five distinct mappings in the standard theme, neutral normal distinct from maintenance, expected token mapping, no dot and one inherited-color arrow verified. A seasonal primary may share a warning hue. Not an overall accessibility audit.`,
    );
    for (const [index, fixture] of backgroundFixtures.entries()) {
      await selectFixture(index);
      await capture(fixture.capture);
      assertBackground(
        await evaluate(
          `(${measureBackground.toString()})(${JSON.stringify(fixture.token)})`,
        ),
        fixture.capture,
      );
    }
    await selectFixture(1);
    await capture(
      "85-fr-homepage-maintenance-spring-primary-background",
      "spring",
    );
    assertBackground(
      await evaluate(`(${measureBackground.toString()})('--primary-soft')`),
      "spring maintenance capture",
    );
    await evaluate(
      `(async()=>{await chrome.storage.local.set({seasonOverride:'none'});await chrome.runtime.sendMessage({source:'PRESENCES_POPUP',type:'SET_SETTINGS',payload:{appearance:'light',seasonalThemes:false}});})()`,
    );
    await applyTheme(false, "");
    const assertNewsNavigation = async () => {
      await wait(
        `document.querySelector('[data-tab="announcements"][aria-hidden="false"] [role="button"]')`,
      );
      await assertNoBanner();
      const navigation = await evaluate(
        `chrome.storage.local.get('sidepanelActiveView').then(state=>({tab:state.sidepanelActiveView,routes:document.querySelectorAll('main > [aria-hidden]:not([data-tab])').length}))`,
      );
      if (navigation.tab !== "announcements" || navigation.routes !== 0)
        throw new Error(
          `Banner did not select the News tab: ${JSON.stringify(navigation)}`,
        );
    };
    await nativeClick(
      1280 - compact.width / 2,
      1000 - compact.viewportHeight + 18,
    );
    await assertNewsNavigation();
    await assertDateOnly('[data-tab="announcements"]', false);
    await capture("86-fr-news-from-banner");
    const activityButton = await evaluate(
      `(()=>{const rect=document.querySelector('button[aria-label="Activité"]').getBoundingClientRect();return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};})()`,
    );
    await nativeClick(
      1280 - compact.width + activityButton.x,
      1000 - compact.viewportHeight + activityButton.y,
    );
    await wait(
      `document.querySelector('[data-tab="activity"][aria-hidden="false"]') && document.querySelector('aside a[href="#announcements"]')`,
    );
    for (let attempt = 0; attempt < 30; attempt++) {
      await key("shift+Tab");
      if (
        await evaluate(
          `document.hasFocus() && document.activeElement===document.querySelector('aside a') && document.activeElement.matches(':focus-visible')`,
        )
      )
        break;
    }
    const keyboardFocus = await evaluate(
      `(()=>{const link=document.querySelector('aside a');return {active:document.activeElement===link,visible:link.matches(':focus-visible'),outline:getComputedStyle(link).outlineWidth};})()`,
    );
    if (
      !keyboardFocus.active ||
      !keyboardFocus.visible ||
      keyboardFocus.outline !== "2px"
    )
      throw new Error(
        `Missing native keyboard focus indication: ${JSON.stringify(keyboardFocus)}`,
      );
    await key("Return");
    await assertNewsNavigation();
    await evaluate(
      `Array.from(document.querySelectorAll('[data-tab="announcements"] [role="button"]')).find(row=>row.textContent.includes('2.4.0')).click()`,
    );
    await wait(
      `document.querySelector('main [aria-hidden="false"] article')?.innerText.includes('Activités personnalisées')`,
    );
    await assertDateOnly('main [aria-hidden="false"] article', true);
    await capture("87-fr-changelog-date-only");
    await back();
    await wait(
      `document.querySelector('[data-tab="announcements"][aria-hidden="false"]')`,
    );
    await evaluate(
      `Array.from(document.querySelectorAll('[data-tab="announcements"] [role="button"]')).find(row=>row.textContent.includes('Bibliothèque temporairement indisponible')).click()`,
    );
    await wait(
      `document.querySelector('main [aria-hidden="false"] article')?.innerText.includes('Nous examinons le problème')`,
    );
    await assertDateOnly('main [aria-hidden="false"] article', true);
    await capture("88-fr-incident-date-only");
    await back();
    for (const [label, tab] of [
      ["Bibliothèque", "store"],
      ["Personnalisés", "custom"],
      ["Réglages", "settings"],
    ]) {
      await click(`button[aria-label="${label}"]`);
      await wait(
        `document.querySelector('[data-tab="${tab}"][aria-hidden="false"]')`,
      );
      await assertNoBanner();
    }
    console.log(
      "PASS: native loaded extension. Onboarding is banner-free without completion/reset. Homepage banner mouse click and native keyboard Enter both select the actual News tab with zero pushed routes. Returning to Activity restores the banner. No disclosure, body or dismissal controls. News/detail/other tabs have no banner. Metadata has dates only; detail date is 9px. Strip has no decorative border/outline/shadow, keyboard focus is visible, and icons inherit text color. Local fixtures only; images not visually inspected.",
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
};
