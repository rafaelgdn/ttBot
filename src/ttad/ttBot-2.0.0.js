/* eslint-disable no-console */
// const { Cluster } = require('../cluster/dist/index');
const { Cluster } = require('puppeteer-cluster')
const { Webhook } = require('discord-webhook-node')
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const {
  blockedResourceTypes,
  skippedResources,
} = require('./utils');

const {
  concurrency,
  totalAmount,
  CPM,
  urls,
} = require('./config.json');

const {
  AdSadOverlay,
} = require('../configs/selectors.json');

const {
  userAgents,
  getRandomIntInclusive,
  sleep,
} = require('../utils');

const hook = new Webhook('https://discordapp.com/api/webhooks/879032127767859220/bFUJlGkVwp6KxcFw4NTM-IAmmVd5qedJrdoKOaKBz1Td6iRwRek7vIQ6yW4pT2JiZcfJ')

// const url = urls[getRandomIntInclusive(0, urls.length - 1)];
const maxViews = (totalAmount * 1000) / CPM;

let index = 0;
const getUrl = () => {
  let url = urls[index];

  if (!url) {
    index = 0;
    url = urls[0]
  }
  console.log({index, url})
  index++;
  return url;
}

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: concurrency,
    // workerCreationDelay: 5000,
    sameDomainDelay: 2000,
    timeout: 200000,
    retryLimit: 1000,
    monitor: true,
    puppeteer,
    puppeteerOptions: {
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      // executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      // executablePath: 'C:/Users/User/Desktop/Twitch/Chromium/bin/chrome.exe',
      // headless: true,
      // executablePath: 'C:/Users/User/Desktop/Twitch/Worker/chrome/worker.exe',
      args: [
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-extensions',
        '--no-default-browser-check',
        '--no-first-run',
        '--allow-running-insecure-content',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=ScriptStreaming',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-renderer-backgrounding',
        '--disable-background-networking',
        '--disable-breakpad',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-sync',
        // '--use-gl="swiftshader"',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-features=Translate,GpuProcessHighPriorityWin,GpuUseDisplayThreadPriority,ExtensionsToolbarMenu',
        '--disk-cache-size=1',
        '--disable-gpu-program-cache',
        '--disable-gpu-shader-disk-cache',
      ],
    },
  });

  await cluster.task(async ({ page, data: uri }) => {
    const userAgent = userAgents[getRandomIntInclusive(0, userAgents.length - 1)];
    await page.setUserAgent(userAgent);

    // Deal with twitch cookies and unnecessary contests
    const client = await page.target().createCDPSession();

    await client.send('Network.enable');
    await client.send('Network.setRequestInterception', {
      patterns: [{
        urlPattern: '*',
      }],
    });

    client.on('Network.requestIntercepted', async ({
      interceptionId,
      request: httpRequest,
      resourceType,
    }) => {
      const continueParams = { interceptionId };
      const requestUrl = httpRequest.url.split('?')[0].split('#')[0];

      if (httpRequest.url === 'https://www.twitch.tv/') {
        continueParams.rawResponse = 'eyBzdGF0dXM6IDIwMCwgY29udGVudFR5cGU6ICd0ZXh0L3BsYWluJywgYm9keTogJzxodG0nICB9';
      } else if (
        blockedResourceTypes.indexOf(resourceType) !== -1
      || skippedResources.some((resource) => requestUrl.indexOf(resource) !== -1)
      ) {
        continueParams.errorReason = 'AddressUnreachable';
      }
      client.send('Network.continueInterceptedRequest', continueParams)
        .catch(() => null);
    });
    // ///////////////////////////////////////

    // set cookies to mute audio and accept mature content
    await page.goto('https://www.twitch.tv/');
    await page.evaluate(() => {
      localStorage.setItem('mature', 'true');
      localStorage.setItem('video-muted', '{"default":false}');
      localStorage.setItem('volume', '0.5');
      localStorage.setItem('video-quality', '{"default":"160p30"}');
    });
    // /////////////////////////////////////////////////

    await page.goto(uri);
    await page.waitForSelector(AdSadOverlay, { timeout: 10000 });
    await page.waitForSelector(AdSadOverlay, { hidden: true, timeout: 181000 });

    await sleep(
      getRandomIntInclusive(3000, 5000),
    );

    await page.close();
  });

  let alreadyQueued = 0;
  while (alreadyQueued < maxViews) {
    const site = getUrl()
    cluster.queue(site);
    alreadyQueued += 1;
  }

  setInterval(() => {
    cluster.monitor()
    hook.send(cluster.webhookMsg);
  }, 60 * 1000);

  await cluster.idle();
  await cluster.close();
})();
