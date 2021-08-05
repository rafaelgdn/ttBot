/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
/* eslint-disable max-len */
/* eslint-disable no-console */
const puppeteer = require('puppeteer');
const { userAgents, getRandomIntInclusive, handleActions } = require('./utils');

const {
  maxActive, totalAmount, CPM, urls,
} = require('./config.json');

const url = urls[getRandomIntInclusive(0, urls.length - 1)];
const total = (totalAmount * 1000) / CPM;
let currentViews = 0;
let active = 0;

console.log(url);

const selectors = {
  overlayMatureAccept: '[data-a-target="player-overlay-mature-accept"]',
  mobileOverlayMatureAccept: 'button.ScCoreButton-sc-1qn4ixc-0.ScCoreButtonPrimary-sc-1qn4ixc-1.bcSyQf.ikTpjw',
  AdVideoAdCountdown: '[data-a-target="video-ad-countdown"]',
  AdSadOverlay: '[data-test-selector="sad-overlay"]',
  AdVideoAdLabel: '[data-a-target="video-ad-label"]',
  AcceptCookies: '[data-a-target="consent-banner-accept"]',
};

const handleFinish = async (page, race, isMobile) => {
  if (!isMobile) await handleActions(page);

  await page.waitForSelector(race, { hidden: true, timeout: 70000 })
    .catch(async () => {
      active -= 1;
      console.log('\x1b[31m%s\x1b[0m', 'Timeout!!!');
      await page.close();
      return false;
    });

  console.log('\x1b[32m%s\x1b[0m', 'Found!!!');
  active -= 1;
  currentViews += 1;
  await page.close();
  return true;
};

const handleMatureAccept = async (page, race, isMobile) => {
  const {
    AdVideoAdCountdown,
    AdSadOverlay,
    AdVideoAdLabel,
  } = selectors;

  await page.evaluate((selector) => {
    document.querySelector(selector).click();
  }, race);

  if (!isMobile) await handleActions(page);

  const secondRace = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
    page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
    page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
  ]);

  switch (secondRace) {
    case 1:
      active -= 1;
      return false;
    case AdVideoAdCountdown:
    case AdSadOverlay:
    case AdVideoAdLabel:
      return handleFinish(page, secondRace);
    default:
      active -= 1;
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
      active -= 1;
      return false;
    case overlayMatureAccept:
    case mobileOverlayMatureAccept:
      return handleMatureAccept(page, race, isMobile);
    case AdSadOverlay:
    case AdVideoAdCountdown:
    case AdVideoAdLabel:
      return handleFinish(page, race);
    default:
      active -= 1;
      return false;
  }
};

const handlePage = async (page) => {
  active += 1;

  const {
    overlayMatureAccept,
    mobileOverlayMatureAccept,
    AdVideoAdCountdown,
    AdSadOverlay,
    AdVideoAdLabel,
    AcceptCookies,
  } = selectors;

  await page.setUserAgent(userAgents[getRandomIntInclusive(0, userAgents.length)]);
  await page.goto(url);

  const isMobile = page.url().match(/m\.twitch.tv/);

  if (isMobile) {
    await page.setViewport({
      width: 1366,
      height: 768,
    });
  }

  await page.evaluate(() => localStorage.setItem('mature', 'true'));
  await page.evaluate(() => localStorage.setItem('video-muted', '{"default":true}'));
  await page.evaluate(() => localStorage.setItem('video-quality', '{"default":"160p30"}'));

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
      active -= 1;
      console.log('\x1b[31m%s\x1b[0m', 'Not found!!!');
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
      active -= 1;
      console.log('Something unexpected happens!');
      await page.close();
      return false;
  }
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  });

  let loop = true;

  while (loop) {
    if (active < maxActive) {
      const page = await browser.newPage();
      handlePage(page);
    }

    if (currentViews >= total) {
      loop = false;
    }
  }
})();
