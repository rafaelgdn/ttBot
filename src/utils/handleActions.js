/* eslint-disable max-len */
const handleActions = async (page) => {
  await page.waitForSelector('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-fzozJi > .sc-fzoiQi > .sc-fzqBZW > .sc-fzokOt > .sc-fzqNJr');
  await page.click('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-fzozJi > .sc-fzoiQi > .sc-fzqBZW > .sc-fzokOt > .sc-fzqNJr');

  await page.waitForSelector('div > .sc-AxiKw:nth-child(3) > .sc-fzqAui > .sc-AxiKw > .sc-AxiKw:nth-child(1)');
  await page.click('div > .sc-AxiKw:nth-child(3) > .sc-fzqAui > .sc-AxiKw > .sc-AxiKw:nth-child(1)');

  await page.waitForSelector('.sc-AxiKw:nth-child(8) > .sc-AxiKw > .sc-AxiKw > .sc-AxiKw > .sc-fznzOf');
  await page.click('.sc-AxiKw:nth-child(8) > .sc-AxiKw > .sc-AxiKw > .sc-AxiKw > .sc-fznzOf');

  // await page.waitForSelector('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > div:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-AxiKw:nth-child(1) > .sc-fzozJi:nth-child(1) > .sc-fzoiQi:nth-child(1) > .sc-fzqBZW:nth-child(1) > .sc-fzokOt:nth-child(1) path:nth-child(1)');
  // await page.click('.sc-AxiKw:nth-child(2) > .sc-AxiKw:nth-child(1) > div:nth-child(2) > .sc-AxiKw:nth-child(1) > .sc-AxiKw:nth-child(1) > .sc-fzozJi:nth-child(1) > .sc-fzoiQi:nth-child(1) > .sc-fzqBZW:nth-child(1) > .sc-fzokOt:nth-child(1) path:nth-child(1)');
};

module.exports = handleActions;
