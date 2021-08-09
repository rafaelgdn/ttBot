/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
const { sleep, getRandomIntInclusive } = require('../utils');

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

  await sleep(getRandomIntInclusive(1000, 5000));

  await page.close();
  return { increseViews: true };
};

module.exports = handleFinish;
