/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-extra');
const request = require('request');
const os = require('os-utils');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const {
  promisify,
} = require('util');

const {
  AdSadOverlay,
} = require('./src/configs/selectors.json');

const {
  userAgents,
  getRandomIntInclusive,
  sleep,
} = require('./src/utils');

const {
  maxActive,
  totalAmount,
  CPM,
  urls,
} = require('./src/configs/config.json');

const blockedResourceTypes = [
  'Svg',
  'svg',
  'Image',
  'image',
  'Font',
  'Texttrack',
  'Object',
  'Beacon',
  'Csp_report',
  'Imageset',
  'font',
  'texttrack',
  'object',
  'beacon',
  'csp_report',
  'imageset',
];

const skippedResources = [
  'quantserve',
  'adzerk',
  'doubleclick',
  'adition',
  'exelator',
  'sharethrough',
  'cdn.api.twitter',
  'google-analytics',
  'googletagmanager',
  'google',
  'fontawesome',
  'facebook',
  'analytics',
  'optimizely',
  'clicktale',
  'mixpanel',
  'zedo',
  'clicksor',
  'tiqcdn',
];

puppeteer.use(StealthPlugin());

const url = urls[getRandomIntInclusive(0, urls.length - 1)];
const maxViews = (totalAmount * 1000) / CPM;
let currentViews = 0;
let active = 0;
let delay = 0;

const main = async () => {
  let browser;
  let chrome;
  let page;
  let client;
  let userAgent;

  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      logLevel: 'silent',
      output: 'json',
    });

    const resp = await promisify(request)(`http://localhost:${chrome.port}/json/version`);
    const { webSocketDebuggerUrl } = JSON.parse(resp.body);

    browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });
    [page] = await browser.pages();
    client = await page.target().createCDPSession();

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
        .catch(() => {
          console.log(
            '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
            '   FAILED    ',
            ` A[${active}] V[${currentViews}] Not found an AD, try again.`,
          );
        });
    });

    userAgent = userAgents[getRandomIntInclusive(0, userAgents.length - 1)];
    await page.setUserAgent(userAgent);

    // set cookies to mute audio and accept mature content
    await page.goto('https://www.twitch.tv/');
    await page.evaluate(() => {
      localStorage.setItem('mature', 'true');
      localStorage.setItem('video-muted', '{"default":false}');
      localStorage.setItem('volume', '0.5');
      localStorage.setItem('video-quality', '{"default":"160p30"}');
    });
    // /////////////////////////////////////////////////

    await page.goto(url);
    await page.waitForSelector(AdSadOverlay, { timeout: 10000 });
    await page.waitForSelector(AdSadOverlay, { hidden: true, timeout: 181000 });
    await page.close();

    currentViews += 1;

    console.log(
      '\x1b[42m\x1b[30m%s\x1b[0m\x1b[32m%s\x1b[0m',
      '   SUCCESS   ',
      ` A[${active}] V[${currentViews}] Found an AD!`,
    );

    if (client) await client.detach();
    if (chrome) await chrome.kill();
    if (browser) await browser.close();
  } catch (error) {
    const e = error.toString();

    if (e.includes('timeout')) {
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
        '   FAILED    ',
        ` A[${active}] V[${currentViews}] Not found an AD, try again.`,
      );
    }

    if (client) await client.detach();
    if (page) await page.close();
    if (chrome) await chrome.kill();
    if (browser) await browser.close();
  }
};

const loop = async () => {
  if (currentViews >= maxViews) return;

  if (active < maxActive) {
    await sleep(delay);
    delay = getRandomIntInclusive(1000, 5000);

    os.cpuUsage(async (value) => {
      if (value > 0.3) {
        // console.log(
        //   '\x1b[103m\x1b[30m%s\x1b[0m\x1b[93m%s\x1b[0m',
        //   '   STAND BY  ',
        //   ` Active: [${active}] Views: [${currentViews}] - Waiting to decrease CPU usage.`,
        // );
        const sleepTime = getRandomIntInclusive(10000, 20000);
        await sleep(sleepTime);
        loop();
      } else {
        active += 1;

        main()
          .then(() => {
            active -= 1;
            loop();
          })
          .catch(() => {
            active -= 1;
            loop();
          });

        loop();
      }
    });
  }
};

loop();
