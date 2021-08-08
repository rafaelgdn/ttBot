/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable max-len */
const puppeteer = require('puppeteer');
const { appendFileSync } = require('fs');

const {
  userAgents,
  getRandomIntInclusive,
  // handleActions,
} = require('./utils');

const {
  maxActive,
  totalAmount,
  CPM,
  urls,
} = require('./config.json');

const url = urls[getRandomIntInclusive(0, urls.length - 1)];
const maxViews = (totalAmount * 1000) / CPM;
let currentViews = 0;
let active = 0;
let userAgent;

const selectors = {
  overlayMatureAccept: '[data-a-target="player-overlay-mature-accept"]',
  mobileOverlayMatureAccept: 'button.ScCoreButton-sc-1qn4ixc-0.ScCoreButtonPrimary-sc-1qn4ixc-1.bcSyQf.ikTpjw',
  AdVideoAdCountdown: '[data-a-target="video-ad-countdown"]',
  AdSadOverlay: '[data-test-selector="sad-overlay"]',
  AdVideoAdLabel: '[data-a-target="video-ad-label"]',
  AcceptCookies: '[class*="consent-banner"]',
  AcceptCookiesButton: '[data-a-target="consent-banner-accept"]',
  deprecatedBrowser: '[class*="deprecated-page"]',
};

const setDomainLocalStorage = async (browser) => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    r.respond({
      status: 200,
      contentType: 'text/plain',
      body: '<htm',
    });
  });
  await page.goto('https://www.twitch.tv/');
  await page.evaluate(() => {
    localStorage.setItem('mature', 'true');
    localStorage.setItem('video-muted', '{"default":false}');
    localStorage.setItem('volume', '0.5');
    localStorage.setItem('video-quality', '{"default":"160p30"}');
  });

  await page.close();
};

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

  userAgent = userAgents[getRandomIntInclusive(0, userAgents.length - 1)];
  await page.setUserAgent(userAgent);
  await page.goto(url);

  const race = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(deprecatedBrowser).then(() => deprecatedBrowser),
    page.waitForSelector(AcceptCookies).then(() => AcceptCookies),
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
    browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    });
    await setDomainLocalStorage(browser);
    const page = await browser.newPage();
    await handlePage(page);
    await browser.close();
  } catch (error) {
    await browser.close();
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
