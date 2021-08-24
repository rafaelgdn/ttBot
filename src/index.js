/* eslint-disable consistent-return */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
/* eslint-disable max-len */
/* eslint-disable no-console */
const puppeteer = require('puppeteer-extra');

const {
  userAgents,
  getRandomIntInclusive,
} = require('./utils');

const {
  maxActive,
  totalAmount,
  CPM,
  urls,
} = require('./configs/config.json');

const url = urls[getRandomIntInclusive(0, urls.length - 1)];
const total = (totalAmount * 1000) / CPM;
let currentViews = 0;
let active = 0;
let userAgent;

const selectors = {
  overlayMatureAccept: '[data-a-target="player-overlay-mature-accept"]',
  mobileOverlayMatureAccept: 'button.ScCoreButton-sc-1qn4ixc-0.ScCoreButtonPrimary-sc-1qn4ixc-1.bcSyQf.ikTpjw',
  AdVideoAdCountdown: '[data-a-target="video-ad-countdown"]',
  AdSadOverlay: '[data-test-selector="sad-overlay"]',
  AdVideoAdLabel: '[data-a-target="video-ad-label"]',
  AcceptCookies: '[data-a-target="consent-banner-accept"]',
};

const handleFinish = async (page, race) => {
  await page.evaluate(() => {
    localStorage.setItem('mature', 'true');
    localStorage.setItem('video-muted', '{"default":false}');
    localStorage.setItem('volume', '0.5');
    localStorage.setItem('video-quality', '{"default":"160p30"}');
  });

  await page.waitForSelector(race, { hidden: true, timeout: 70000 })
    .catch(async () => {
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
        ' TIMEOUT ',
        ' The task timed out',
      );

      await page.close();
      return false;
    });

  currentViews += 1;

  console.log(
    '\x1b[42m\x1b[30m%s\x1b[0m\x1b[32m%s\x1b[0m',
    ' SUCCESS ',
    ` Found an AD, Current views (${currentViews})`,
  );

  await page.close();
  return true;
};

const handleMatureAccept = async (page, race) => {
  const {
    AdVideoAdCountdown,
    AdSadOverlay,
    AdVideoAdLabel,
  } = selectors;

  await page.evaluate((selector) => {
    document.querySelector(selector).click();
  }, race);

  const secondRace = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
    page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
    page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
  ]);

  switch (secondRace) {
    case 1:
      console.log(
        '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m\n%s',
        ' FAILED ',
        ' Not found an AD, try again.',
        userAgent,
      );
      return false;
    case AdVideoAdCountdown:
    case AdSadOverlay:
    case AdVideoAdLabel:
      return handleFinish(page, secondRace);
    default:
      return false;
  }
};

const handleCookies = async (page, isMobile) => {
  const {
    mobileOverlayMatureAccept,
    overlayMatureAccept,
    AcceptCookies,
    AdVideoAdCountdown,
    AdSadOverlay,
    AdVideoAdLabel,
  } = selectors;

  await page.evaluate((selector) => {
    document.querySelector(selector).click();
  }, AcceptCookies);

  const race = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(overlayMatureAccept).then(() => overlayMatureAccept),
    page.waitForSelector(mobileOverlayMatureAccept).then(() => mobileOverlayMatureAccept),
    page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
    page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
    page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
  ]);

  switch (race) {
    case 1:
      // active -= 1;
      return false;
    case overlayMatureAccept:
    case mobileOverlayMatureAccept:
      return handleMatureAccept(page, race, isMobile);
    case AdSadOverlay:
    case AdVideoAdCountdown:
    case AdVideoAdLabel:
      return handleFinish(page, race);
    default:
      // active -= 1;
      return false;
  }
};

const handlePage = async (page) => {
  try {
    const {
      overlayMatureAccept,
      mobileOverlayMatureAccept,
      AdVideoAdCountdown,
      AdSadOverlay,
      AdVideoAdLabel,
      AcceptCookies,
    } = selectors;

    userAgent = userAgents[getRandomIntInclusive(0, userAgents.length)];
    await page.setUserAgent(userAgent);
    await page.goto(url);

    const isMobile = page.url().match(/m\.twitch.tv/);

    if (isMobile) {
      await page.setViewport({
        width: 1366,
        height: 768,
      });
    }

    const race = await Promise.race([
      page.waitForTimeout(10000).then(() => 1),
      page.waitForSelector(AcceptCookies).then(() => AcceptCookies),
      page.waitForSelector(overlayMatureAccept).then(() => overlayMatureAccept),
      page.waitForSelector(mobileOverlayMatureAccept).then(() => mobileOverlayMatureAccept),
      page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
      page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
      page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
    ]);

    switch (race) {
      case 1:
        // active -= 1;

        console.log(
          '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m\n%s',
          ' FAILED ',
          ' Not found an AD, try again.',
          userAgent,
        );

        await page.close();
        return false;
      case AcceptCookies:
        return handleCookies(page, isMobile);
      case overlayMatureAccept:
      case mobileOverlayMatureAccept:
        return handleMatureAccept(page, race, isMobile);
      case AdSadOverlay:
      case AdVideoAdCountdown:
      case AdVideoAdLabel:
        return handleFinish(page, race, isMobile);
      default:
        // active -= 1;

        console.log(
          '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m\n',
          ' ERROR ',
          ' Something unexpected happens.',
          userAgent,
        );

        await page.close();
        return false;
    }
  } catch (error) {
    console.log(
      '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m\n\n\n%s',
      ' ERROR ',
      ' Something unexpected happens.',
      userAgent,
      error,
    );

    return false;
  }
};

const main = async () => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      executablePath: '/usr/bin/google-chrome-stable',
    });

    const page = await browser.newPage();
    await handlePage(page);
    await browser.close();
    active -= 1;
  } catch (error) {
    await browser.close();
    active -= 1;
    console.log(
      '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
      ' ERROR ',
      ' Something unexpected happens.',
    );
  }
};

const loop = async () => {
  if (currentViews >= total) return null;

  if (active < maxActive) {
    active += 1;
    main().then(() => loop()).catch(() => loop());
    loop();
  }
};

loop();
