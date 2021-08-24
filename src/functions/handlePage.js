/* eslint-disable no-console */
const selectors = require('../configs/selectors.json');

const handleCookies = require('./handleCookies');
const handleDeprecated = require('./handleDeprecated');
const handleFinish = require('./handleFinish');

const {
  userAgents,
  getRandomIntInclusive,
} = require('../utils');

let userAgent;

const handlePage = async (page, currentViews, url) => {
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
  currentViews += 1;
  
  await page.screenshot({ path: `screenshot-goto${currentViews}.png` } )
  console.log('taking screenshot one')

  const race = await Promise.race([
    page.waitForTimeout(10000).then(() => 1),
    page.waitForSelector(deprecatedBrowser).then(() => deprecatedBrowser),
    page.waitForSelector(AcceptCookies).then(() => AcceptCookies),
    page.waitForSelector(AdSadOverlay).then(() => AdSadOverlay),
    page.waitForSelector(AdVideoAdCountdown).then(() => AdVideoAdCountdown),
    page.waitForSelector(AdVideoAdLabel).then(() => AdVideoAdLabel),
  ]);

  await page.screenshot({ path: `screenshot-race${currentViews}.png` } )
  console.log('taking screenshot two')

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
      handleDeprecated(userAgent);
      throw new Error();
    case AcceptCookies:
      return handleCookies(page);
    case AdSadOverlay:
    case AdVideoAdCountdown:
    case AdVideoAdLabel:
      return handleFinish(page, race, currentViews);
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

module.exports = handlePage;
