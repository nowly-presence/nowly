import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";

const BASE_URL = "http://127.0.0.1:43988";
const OUTPUT = process.env.PRESENCE_UPDATES_CAPTURE_DIR ?? "/tmp/opencode/presence-update-all/captures";
const SCREEN_WIDTH = 1280;

const fixtureSource = `(() => {
  const config = JSON.parse(sessionStorage.getItem('bulk-fixture') || '{"count":2,"grid":false}');
  const entry = (slug, name, source) => {
    const metadata = { slug, name, author:{name:'Layout fixture'}, description:{en:'Controlled update fixture'}, url:[slug+'.example.test'], color:'#627DB4', category:'other' };
    return {metadata,enabled:true,source,installedAt:1,release:{slug,version:'1',metadata,bundle:'',sha256:'',metadataHash:'',signature:'',signedAt:''}};
  };
  const data = globalThis.bulkFixture = {
    presences: {netflix:entry('netflix','Netflix','store'),spotify:entry('spotify','Spotify','store'),local:entry('local','Local fixture','local')},
    updates: {...(config.count>0?{netflix:'2'}:{}),...(config.count>1?{spotify:'2'}:{}),local:'2',unknown:'2'},
    settings:{appearance:'light',seasonalThemes:false,presenceDisplayMode:config.grid?'grid':'category',showPlayer:true},
    calls:[],pending:[],maxConcurrent:0,concurrent:0,
    finish(slug, ok=true) { const pending = this.pending.find(item=>item.slug===slug); if(!pending)throw new Error('No pending update '+slug); this.pending=this.pending.filter(item=>item!==pending);this.concurrent--;if(ok){delete this.updates[slug];this.presences[slug].release.version='2';}pending.resolve(ok?{ok:true}:{ok:false,error:'RELEASE_SIGNATURE_INVALID'}); }
  };
  const legal = {manifest:{schemaVersion:1,documents:{tos:{version:2,requiredVersion:1,updatedAt:'2026-10-24',path:'/tos'},privacy:{version:1,requiredVersion:1,updatedAt:'2026-10-16',path:'/privacy'}}},tosAcceptance:{version:2,recordedAt:new Date().toISOString()},privacyAcknowledgement:{version:1,recordedAt:new Date().toISOString()},checkedAt:Date.now(),checkFailed:false};
  chrome.runtime.sendMessage = async (message) => {
    const {type,payload} = message;
    data.calls.push({type,payload});
    switch(type) {
      case 'GET_PRESENCES': return structuredClone(data.presences);
      case 'CHECK_UPDATES': return {...data.updates};
      case 'GET_SETTINGS': return {...data.settings};
      case 'SET_SETTINGS': Object.assign(data.settings,payload);return {...data.settings};
      case 'INSTALL_PRESENCE_FROM_API':
        data.concurrent++;data.maxConcurrent=Math.max(data.maxConcurrent,data.concurrent);
        return new Promise(resolve=>data.pending.push({slug:payload.slug,resolve}));
      case 'UNINSTALL_PRESENCE': delete data.presences[payload.slug];delete data.updates[payload.slug];return {ok:true};
      case 'GET_PRESENCE_ENGAGEMENT': return {liked:false,likeCount:0,totalInstalls:0,activeUsers:0};
      case 'GET_NATIVE_STATUS': return {connected:false,discordConnected:false,status:'Specified native messaging host not found.'};
      case 'GET_USER_SCRIPTS_STATUS': return {enabled:true};
      case 'GET_ONBOARDING': return {onboardingCompleted:true,devReplayOnboarding:false,nativeSeenConnectedOnce:true};
      case 'GET_TAB_STATE': return {tabId:null,hostname:null,muted:false,installedSlug:null,activities:[]};
      case 'GET_CURRENT_ACTIVITY': case 'GET_CUSTOM_ACTIVITY_DETECTION': return null;
      case 'GET_CUSTOM_ACTIVITIES': return {items:[],activeId:null,activatedAt:null};
      case 'GET_ACCOUNT': case 'SYNC_ACCOUNT': return {signedIn:false};
      case 'GET_ANALYTICS_CONSENT': return {granted:false};
      case 'FETCH_PRESENCE_CATALOG': return {ok:true,items:[]};
      case 'GET_PRESENCE_SETTINGS': return {};
      case 'GET_ANNOUNCEMENTS': case 'REFRESH_ANNOUNCEMENTS': return {};
      case 'GET_LEGAL_STATE': case 'CHECK_LEGAL_DOCUMENTS': return legal;
      case 'TRACK_EVENT': case 'RECORD_USAGE_DAY': return {ok:true};
      default: throw new Error('Unexpected fixture message: '+type);
    }
  };
})();`;

export default async ({ page, context, worker, extensionId, shot, key, sleep }) => {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({ method: request.method, path: request.url });
    response.setHeader("Access-Control-Allow-Origin", "*");
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<!doctype html><title>Controlled bulk update fixture</title><h1>Nowly installed presence update verification</h1>");
    } else {
      response.writeHead(404, { "content-type": "application/json" });
      response.end("{}");
    }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(43988, "127.0.0.1", resolve); });
  try {
    await context.route(/^https?:\/\//, route => route.request().url().startsWith(BASE_URL) ? route.continue() : route.abort());
    await worker.evaluate(async () => {
      await chrome.storage.local.set({
        settings: { appearance: "light", seasonalThemes: false },
        localePreference: "fr",
        sidepanelActiveView: "activity",
        analyticsConsent: false,
        onboarding: { onboardingCompleted: true, devReplayOnboarding: false, nativeSeenConnectedOnce: true },
        featureReveals: { announcements: Date.now(), "custom-activity": Date.now(), "account-sync": Date.now() },
        reviewPrompt: { firstSeenAt: Date.now(), dismissedAt: Date.now() }
      });
    });
    await page.goto(BASE_URL);
    await key("ctrl+shift+y");
    await sleep(1000);
    const session = await context.newCDPSession(page);
    const { targetInfos } = await session.send("Target.getTargets");
    const target = targetInfos.find(candidate => candidate.url.startsWith(`chrome-extension://${extensionId}/sidepanel/`));
    if (!target) throw new Error("Native extension sidepanel did not open");
    const { sessionId } = await session.send("Target.attachToTarget", { targetId: target.targetId, flatten: false });
    let id = 0;
    const command = (method, params = {}) => new Promise((resolve, reject) => {
      const commandId = ++id;
      const receive = event => {
        if (event.sessionId !== sessionId) return;
        const message = JSON.parse(event.message);
        if (message.id !== commandId) return;
        session.off("Target.receivedMessageFromTarget", receive);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      };
      session.on("Target.receivedMessageFromTarget", receive);
      session.send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id: commandId, method, params }) }).catch(reject);
    });
    const evaluate = async expression => {
      const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result?.value;
    };
    const wait = condition => evaluate(`new Promise((resolve,reject)=>{const start=Date.now();const timer=setInterval(()=>{if(${condition}){clearInterval(timer);resolve(true);}else if(Date.now()-start>10000){clearInterval(timer);reject(new Error('Timed out: '+${JSON.stringify(condition)}));}},40);})`);
    await command("Page.enable");
    await command("Page.addScriptToEvaluateOnNewDocument", { source: fixtureSource });
    await command("Page.reload");
    const bulk = `Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes(document.documentElement.lang==='de'?'Alle aktualisieren':'Tout mettre à jour'))`;
    const toggle = `document.querySelector('button[aria-label="Vue grille"],button[aria-label="Vue liste"],button[aria-label="Rasteransicht"],button[aria-label="Listenansicht"]')`;
    await wait(bulk);
    await evaluate("document.fonts.ready");
    const resize = async width => {
      await command("Emulation.clearDeviceMetricsOverride");
      if (width === 320) {
        await command("Emulation.setDeviceMetricsOverride", { width, height: await evaluate("innerHeight"), deviceScaleFactor: 1, mobile: false });
        await sleep(200);
        return;
      }
      for (const offset of [9, 1, 5, 13, 17, 21, 25, 29]) {
        const previous = await evaluate("innerWidth");
        if (Math.abs(previous - width) <= 1) return;
        execFileSync("xdotool", ["mousemove", String(SCREEN_WIDTH - previous - offset), "380", "mousedown", "1", "mousemove", "--sync", String(SCREEN_WIDTH - width - offset), "380", "mouseup", "1"]);
        await sleep(200);
      }
      if (Math.abs(await evaluate("innerWidth") - width) > 1) throw new Error("Native sidepanel width did not match " + width);
    };
    const results = [];
    const verify = async (name, expectedBulk) => {
      const result = await evaluate(`(()=>{const bulk=${bulk};const toggle=${toggle};const rect=toggle.getBoundingClientRect();const bulkRect=bulk?.getBoundingClientRect();const header=toggle.parentElement.parentElement;return {lang:document.documentElement.lang,width:innerWidth,bulk:!!bulk,bulkHeight:bulkRect?.height,busy:bulk?.getAttribute('aria-busy'),disabled:bulk?.disabled,toggle:{width:rect.width,height:rect.height,outlined:toggle.classList.contains('border'),borderWidth:getComputedStyle(toggle).borderTopWidth},left:!bulkRect||bulkRect.right<=rect.left,overflow:header.scrollWidth>header.clientWidth,bodyOverflow:document.documentElement.scrollWidth>innerWidth,label:bulk?.textContent,headerHeight:header.getBoundingClientRect().height};})()`);
      const expectedSize = expectedBulk ? 32 : 28;
      if (result.bulk !== expectedBulk || result.toggle.outlined !== expectedBulk || result.toggle.width !== expectedSize || result.toggle.height !== expectedSize || (expectedBulk && result.bulkHeight !== result.toggle.height) || !result.left || result.overflow || result.bodyOverflow) throw new Error(name + ": " + JSON.stringify(result));
      results.push({ name, ...result });
      await shot(name);
    };
    for (const width of [400, 360, 320]) {
      await resize(width);
      await verify(`fr-list-two-${width}`, true);
      await evaluate(`${toggle}.focus()`);
      await key("Return");
      await wait(`${toggle}.getAttribute('aria-label')==='Vue liste'`);
      await verify(`fr-grid-two-${width}`, true);
      await evaluate(`${toggle}.focus()`);
      await key("Return");
      await wait(`${toggle}.getAttribute('aria-label')==='Vue grille'`);
    }
    await resize(400);
    await evaluate(`${bulk}.click();${bulk}.click()`);
    await wait("bulkFixture.pending.length===1");
    if (await evaluate("bulkFixture.calls.filter(call=>call.type==='INSTALL_PRESENCE_FROM_API').length") !== 1) throw new Error("Duplicate click started overlapping installs");
    await evaluate("bulkFixture.finish('netflix')");
    await wait("bulkFixture.pending.some(item=>item.slug==='spotify')");
    await verify("fr-busy-one-remaining", true);
    const busy = results.at(-1);
    if (busy.busy !== "true" || !busy.disabled) throw new Error("Busy action was not accessible and disabled");
    await evaluate(`${toggle}.focus()`);
    await key("Return");
    await wait(`${toggle}.getAttribute('aria-label')==='Vue liste'`);
    await verify("fr-grid-busy-one-remaining", true);
    await evaluate(`${toggle}.focus()`);
    await key("Return");
    await wait(`${toggle}.getAttribute('aria-label')==='Vue grille'`);
    await evaluate("bulkFixture.finish('spotify',false)");
    await wait(`!(${bulk})`);
    await verify("fr-partial-failure-one-retryable", false);
    if (!(await evaluate("bulkFixture.updates.spotify==='2'&&bulkFixture.maxConcurrent===1"))) throw new Error("Failure was removed or installs overlapped");
    const partial = await evaluate("({calls:bulkFixture.calls.filter(call=>['INSTALL_PRESENCE_FROM_API','GET_PRESENCES','CHECK_UPDATES'].includes(call.type)),maxConcurrent:bulkFixture.maxConcurrent,remaining:bulkFixture.updates})");
    const reset = async () => {
      await evaluate("sessionStorage.setItem('bulk-fixture',JSON.stringify({count:2,grid:false}))");
      await command("Page.reload");
      await wait(bulk);
    };
    const row = name => `Array.from(document.querySelectorAll('[role="button"]')).find(row=>row.textContent.includes(${JSON.stringify(name)}))`;
    const detailUpdate = `Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Mettre à jour vers'))`;
    const removeButton = `Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Retirer la présence')`;
    await reset();
    await evaluate(`${bulk}.click()`);
    await wait("bulkFixture.pending.some(item=>item.slug==='netflix')");
    await evaluate(`${row("Spotify")}.click()`);
    await wait(removeButton);
    await evaluate(`${removeButton}.click()`);
    await wait("document.querySelector('[role=dialog]')");
    await evaluate("Array.from(document.querySelector('[role=dialog]').querySelectorAll('button')).find(button=>button.textContent==='Retirer la présence').click()");
    await evaluate("bulkFixture.finish('netflix')");
    await wait("!bulkFixture.presences.spotify");
    await wait(toggle);
    const removedQueued = await evaluate("({installs:bulkFixture.calls.filter(call=>call.type==='INSTALL_PRESENCE_FROM_API').map(call=>call.payload.slug),removals:bulkFixture.calls.filter(call=>call.type==='UNINSTALL_PRESENCE').map(call=>call.payload.slug),installed:Object.keys(bulkFixture.presences)})");
    if (JSON.stringify(removedQueued.installs) !== '["netflix"]' || removedQueued.installed.includes('spotify')) throw new Error("Removed queued presence was reinstalled: " + JSON.stringify(removedQueued));
    await verify("fr-queued-removal-not-reinstalled", false);
    await reset();
    await evaluate(`${bulk}.click()`);
    await wait("bulkFixture.pending.some(item=>item.slug==='netflix')");
    await evaluate(`${row("Netflix")}.click()`);
    await wait(detailUpdate);
    if (!(await evaluate(`${detailUpdate}.disabled`))) throw new Error("Detail update did not share bulk pending state");
    await shot("fr-detail-shared-update-busy");
    await evaluate(`${detailUpdate}.disabled=false;${detailUpdate}.click()`);
    await sleep(100);
    if ((await evaluate("bulkFixture.calls.filter(call=>call.type==='INSTALL_PRESENCE_FROM_API').length")) !== 1) throw new Error("Stale detail update event duplicated bulk install");
    await evaluate("bulkFixture.finish('netflix')");
    await wait("bulkFixture.pending.some(item=>item.slug==='spotify')");
    await evaluate("bulkFixture.finish('spotify')");
    await evaluate("document.querySelector('button[aria-label=Retour]').click()");
    await wait(`(${toggle})&&!(${bulk})`);
    const concurrentDetail = await evaluate("({installs:bulkFixture.calls.filter(call=>call.type==='INSTALL_PRESENCE_FROM_API').map(call=>call.payload.slug),maxConcurrent:bulkFixture.maxConcurrent})");
    if (JSON.stringify(concurrentDetail.installs) !== '["netflix","spotify"]' || concurrentDetail.maxConcurrent !== 1) throw new Error("Cross-instance update coordination failed: " + JSON.stringify(concurrentDetail));
    await verify("fr-detail-joined-single-install", false);
    for (const count of [0, 1]) {
      await evaluate(`sessionStorage.setItem('bulk-fixture',JSON.stringify({count:${count},grid:false}))`);
      await command("Page.reload");
      await wait(toggle);
      await verify(`fr-list-${count}-eligible`, false);
      await evaluate(`${toggle}.focus()`);
      await key("Return");
      await wait(`${toggle}.getAttribute('aria-label')==='Vue liste'`);
      await verify(`fr-grid-${count}-eligible`, false);
    }
    await worker.evaluate(() => chrome.storage.local.set({ localePreference: "de" }));
    await evaluate("sessionStorage.setItem('bulk-fixture',JSON.stringify({count:2,grid:false}))");
    await command("Page.reload");
    await wait(`${bulk}&&document.documentElement.lang==='de'`);
    for (const width of [400, 360, 320]) {
      await resize(width);
      await verify(`de-list-two-${width}`, true);
    }
    await resize(400);
    await evaluate(`${bulk}.click()`);
    await wait("bulkFixture.pending.length===1");
    await evaluate("bulkFixture.finish('netflix')");
    await wait("bulkFixture.pending.some(item=>item.slug==='spotify')");
    await evaluate("bulkFixture.finish('spotify')");
    await wait(`!(${bulk})`);
    await verify("de-success-zero-remaining", false);
    const success = await evaluate("({slugs:bulkFixture.calls.filter(call=>call.type==='INSTALL_PRESENCE_FROM_API').map(call=>call.payload.slug),maxConcurrent:bulkFixture.maxConcurrent,remaining:bulkFixture.updates})");
    if (JSON.stringify(success.slugs) !== '["netflix","spotify"]' || success.maxConcurrent !== 1) throw new Error("Unexpected eligible batch: " + JSON.stringify(success));
    writeFileSync(join(OUTPUT, "results.json"), JSON.stringify({ surface: "native Chrome extension sidepanel", runtime: "controlled message fixture, no downloaded scripts installed", results, partial, success, removedQueued, concurrentDetail, loopbackRequests: requests }, null, 2));
    console.log(JSON.stringify({ captures: results.length + 1, geometry:results.map(({name,bulkHeight,toggle})=>({name,bulkHeight,toggleWidth:toggle.width,toggleHeight:toggle.height})),partial,success,removedQueued,concurrentDetail }));
  } catch (error) {
    await shot("failure");
    throw error;
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
};
