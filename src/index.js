/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
const puppeteer = require('puppeteer');
const userAgents = require('./utils/userAgents');

const url = 'https://www.twitch.tv/abbadammit';
// const money = 5;
// const total = (money * 1000) / 3.5;
// let current = 0;

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const handleActions = async (page) => {
  await page.waitForSelector('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-fzozJi > .sc-fzoiQi > .sc-fzqBZW > .sc-fzokOt > .sc-fzqNJr');
  await page.click('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-fzozJi > .sc-fzoiQi > .sc-fzqBZW > .sc-fzokOt > .sc-fzqNJr');

  await page.waitForSelector('div > .sc-AxiKw:nth-child(3) > .sc-fzqAui > .sc-AxiKw > .sc-AxiKw:nth-child(1)');
  await page.click('div > .sc-AxiKw:nth-child(3) > .sc-fzqAui > .sc-AxiKw > .sc-AxiKw:nth-child(1)');

  await page.waitForSelector('.sc-AxiKw:nth-child(8) > .sc-AxiKw > .sc-AxiKw > .sc-AxiKw > .sc-fznzOf');
  await page.click('.sc-AxiKw:nth-child(8) > .sc-AxiKw > .sc-AxiKw > .sc-AxiKw > .sc-fznzOf');

  await page.waitForSelector('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > div:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-AxiKw:nth-child(1) > .sc-fzozJi:nth-child(1) > .sc-fzoiQi:nth-child(1) > .sc-fzqBZW:nth-child(1) > .sc-fzokOt:nth-child(1) path:nth-child(1)');
  await page.click('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > div:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-AxiKw:nth-child(1) > .sc-fzozJi:nth-child(1) > .sc-fzoiQi:nth-child(1) > .sc-fzqBZW:nth-child(1) > .sc-fzokOt:nth-child(1) path:nth-child(1)');
};

// const times = (x) => async (f) => {
//   if (x > 0) {
//     f();
//     times(x - 1)(await f);
//   }
// };

const selectors = {
  overlayMatureAccept: '[data-a-target="player-overlay-mature-accept"]',
  mobileOverlayMatureAccept: 'button.ScCoreButton-sc-1qn4ixc-0.ScCoreButtonPrimary-sc-1qn4ixc-1.bcSyQf.ikTpjw',
  AdVideoAdCountdown: '[data-a-target="video-ad-countdown"]',
  AdSadOverlay: '[data-test-selector="sad-overlay"]',
  AdVideoAdLabel: '[data-a-target="video-ad-label"]',
};

const main = async () => {
  const {
    overlayMatureAccept,
    mobileOverlayMatureAccept,
    AdVideoAdCountdown,
    AdSadOverlay,
    AdVideoAdLabel,
  } = selectors;

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  });

  const page = await browser.newPage();
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

  const firstRace = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(overlayMatureAccept).then(() => overlayMatureAccept),
    page.waitForSelector(mobileOverlayMatureAccept).then(() => mobileOverlayMatureAccept),
    page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
    page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
    page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
  ]);

  if (firstRace === overlayMatureAccept || firstRace === mobileOverlayMatureAccept) {
    await page.evaluate((selector) => {
      document.querySelector(selector).click();
    }, firstRace);

    if (!isMobile) await handleActions(page);

    const secondRace = await Promise.race([
      page.waitForTimeout(10000).then(() => 1),
      page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
      page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
      page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
    ]);

    if (secondRace === 1) {
      console.log('\x1b[31m%s\x1b[0m', 'Not found!!!');
      await page.close();
      return false;
    }

    await page.waitForSelector(secondRace, { hidden: true, timeout: 70000 })
      .catch(async () => {
        console.log('\x1b[31m%s\x1b[0m', 'Timeout!!!');
        await page.close();
        return false;
      });

    console.log('\x1b[32m%s\x1b[0m', 'Found!!!');
    // current += 1;
    await page.close();
    return true;
  }

  if (firstRace === 1) {
    console.log('\x1b[31m%s\x1b[0m', 'Not found!!!');
    await page.close();
    return false;
  }

  if (!isMobile) await handleActions(page);

  await page.waitForSelector(firstRace, { hidden: true, timeout: 70000 })
    .catch(async () => {
      console.log('\x1b[31m%s\x1b[0m', 'Timeout!!!');
      await page.close();
      return false;
    });

  console.log('\x1b[32m%s\x1b[0m', 'Found!!!');
  // current += 1;
  await page.close();
  return true;
};

const loop = async () => {
  await main();
  // while (current < total) {
  //   // eslint-disable-next-line no-await-in-loop
  //   times(5)(await main());
  // }
};

loop();
