/* eslint-disable no-console */
const selectors = require('../configs/selectors.json');
const handleFinish = require('./handleFinish');

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

module.exports = handleCookies;
