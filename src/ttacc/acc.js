const { Cluster } = require('../cluster/dist/index')
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs')
const readline = require('readline')

puppeteer.use(StealthPlugin());

const {
    userAgents,
    getRandomIntInclusive,
    sleep,
  } = require('../utils');
const { ApplicationCommandManager } = require('discord.js');

const getRandomName = async () => {
  const lines = [];
  const fileStream = fs.createReadStream('./src/ttacc/usernames.txt');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  for await (const line of rl) {
    lines.push(line)
  }

  return `${lines[getRandomIntInclusive(0, lines.length - 1)]}${lines[getRandomIntInclusive(0, lines.length - 1)]}${getRandomIntInclusive(00, 99)}`
  
}


  (async () => {
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 1,
      workerCreationDelay: 5000,
      // sameDomainDelay: 2000,
      timeout: 200000,
      retryLimit: 1000,
      monitor: false,
      puppeteer,
      puppeteerOptions: {
        headless: false,
        // executablePath: '/home/rafaeldecarvalho_ps/ungoogled-chromium_92.0.4515.159_1.vaapi_linux/chrome',
        // executablePath: '/home/ubuntu/ungoogled-chromium_92.0.4515.159_1.vaapi_linux/chrome',
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        // executablePath: 'C:/Users/User/Desktop/Twitch/Chromium/bin/chrome.exe',
        // headless: true,
        // executablePath: 'C:/Users/User/Desktop/Twitch/Worker/chrome/worker.exe',
        args: [
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
      },
    });

    await cluster.task(async ({ page, data: uri }) => {
      try {
        const userAgent = userAgents[getRandomIntInclusive(0, userAgents.length - 1)];
        await page.setUserAgent(userAgent);
        await page.goto(uri, { waitUntil: 'networkidle2'});
        await page.waitForSelector('[data-a-target="signup-button"]')
        await page.click('[data-a-target="signup-button"]')

        let username = await getRandomName();
        while (username.length > 24 || /[^a-zA-Z0-9]/.test(username)) username = await getRandomName();
        const password = Buffer.from(username).toString('base64')

        await page.waitForSelector('#signup-username')
        await page.type('#signup-username', username, { delay: 0})
        await page.focus('#password-input')
        await page.type('#password-input', password, { delay: 0})
        await page.focus('#password-input-confirmation')
        await page.type('#password-input-confirmation', password, { delay: 0})
        await page.focus('[data-a-target="birthday-date-input"] > input')
        await page.type('[data-a-target="birthday-date-input"] > input', '24', { delay: 0})
        await page.focus('[data-a-target="birthday-month-select"]')
        await page.select('[data-a-target="birthday-month-select"]', '4')
        await page.focus('[data-a-target="birthday-year-input"] > input')
        await page.type('[data-a-target="birthday-year-input"] > input', '1989', { delay: 0})
        await page.focus('#email-input')
        await page.type('#email-input', `${username}@yahoo.com`, { delay: 0 })
        await page.waitForSelector('[data-a-target="passport-signup-button"]')
        await sleep(2029)
        await page.click('[data-a-target="passport-signup-button"]')

        await page.waitForSelector('#FunCaptcha-Token')
        const value = await page.$eval('#FunCaptcha-Token', el => el.value)
        const [, pKey] = value.match(/\|pk=(.*?)\|/)
        const [, surl] = value.match(/\|surl=(.*)/)
        const decodedSurl = decodeURIComponent(surl)
        
        await page.$eval('#submit-btn', el => el.disabled = false)

        

        await sleep(999999999)
      } catch (e) {
        console.log(e)
        throw e
      }
      

  });

  cluster.queue('https://www.twitch.tv/')
  await cluster.idle();
  await cluster.close();
})();