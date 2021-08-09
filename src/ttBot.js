/* eslint-disable no-console */
require('events').EventEmitter.defaultMaxListeners = 100;
const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-extra');
const request = require('request');
const { promisify } = require('util');
const { appendFileSync } = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const treekill = require('tree-kill');
const selectors = require('./selectors.json');

const {
  userAgents,
  getRandomIntInclusive,
  setDomainLocalStorage,
  removeUnnecessaryContent,
} = require('./utils');

const {
  maxActive,
  totalAmount,
  CPM,
  urls,
} = require('./config.json');

puppeteer.use(StealthPlugin());

const url = urls[getRandomIntInclusive(0, urls.length - 1)];
const maxViews = (totalAmount * 1000) / CPM;
let currentViews = 0;
let active = 0;
let userAgent;

const handleFinish = async (page, race) => {
  await page.waitForSelector(race, { hidden: true, timeout: 70000 })
    .catch(async (e) => {
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
        ' TIMEOUT    ',
        ' The task timed out',
      );

      await page.close();
      throw new Error(e);
    });

  currentViews += 1;

  console.log(
    '\x1b[42m\x1b[30m%s\x1b[0m\x1b[32m%s\x1b[0m',
    ' SUCCESS    ',
    ` Found an AD, Current views (${currentViews})`,
  );

  await page.close();
  return true;
};

const handleCookies = async (page) => {
  const {
    AcceptCookiesButton,
    AdVideoAdCountdown,
    AdSadOverlay,
    AdVideoAdLabel,
  } = selectors;

  await page.evaluate((selector) => {
    document.querySelector(selector).click();
  }, AcceptCookiesButton);

  const race = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
    page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
    page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
  ]);

  switch (race) {
    case 1:
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
        ' FAILED     ',
        ' Not found an AD, try again.',
      );
      throw new Error();
    case AdSadOverlay:
    case AdVideoAdCountdown:
    case AdVideoAdLabel:
      return handleFinish(page, race);
    default:
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
        ' ERROR      ',
        ' Something unexpected happens.',
      );
      throw new Error();
  }
};

const handleDeprecated = () => {
  console.log(
    '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
    ' DEPRECATED ',
    ' The browser is deprecated, saving into txt.',
  );
  appendFileSync('deprecated.txt', `\n${userAgent}`);
};

const handlePage = async (page) => {
  const {
    AdVideoAdCountdown,
    AdSadOverlay,
    AdVideoAdLabel,
    AcceptCookies,
    deprecatedBrowser,
  } = selectors;

  console.log(1);

  userAgent = userAgents[getRandomIntInclusive(0, userAgents.length - 1)];
  await page.setUserAgent(userAgent);
  await page.goto(url, {
    waitUntil: [
      'load',
      'domcontentloaded',
      'networkidle0',
      'networkidle2',
    ],
  });

  console.log(2);

  const race = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(deprecatedBrowser).then(() => deprecatedBrowser),
    page.waitForSelector(AcceptCookies).then(() => AcceptCookies),
    page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
    page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
    page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
  ]);

  console.log({ race });

  switch (race) {
    case 1:
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
        ' FAILED     ',
        ' Not found an AD, try again.',
      );
      await page.close();
      throw new Error();
    case deprecatedBrowser:
      handleDeprecated();
      throw new Error();
    case AcceptCookies:
      return handleCookies(page);
    case AdSadOverlay:
    case AdVideoAdCountdown:
    case AdVideoAdLabel:
      return handleFinish(page, race);
    default:
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
        ' ERROR      ',
        ' Something unexpected happens.',
      );
      await page.close();
      throw new Error();
  }
};

const main = async () => {
  let browser;

  try {
    const chrome = await chromeLauncher.launch({
      chromeFlags: [
        // '--headless',
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
    await setDomainLocalStorage(browser);
    // const page = await removeUnnecessaryContent(browser);
    const page = await browser.newPage();

    await handlePage(page);
    treekill(browser.process().pid, 'SIGKILL');
    // await browser.close();
  } catch (error) {
    treekill(browser.process().pid, 'SIGKILL');
    // await browser.close();
  }
};

const loop = async () => {
  if (currentViews >= maxViews) return;

  if (active < maxActive) {
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
};

loop();
