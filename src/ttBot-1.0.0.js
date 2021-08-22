/* eslint-disable no-console */
require('events').EventEmitter.defaultMaxListeners = 100;
const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-extra');
const request = require('request');
const { promisify } = require('util');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const treekill = require('tree-kill');
const handlePage = require('./functions/handlePage');

const {
  getRandomIntInclusive,
  setDomainLocalStorage,
  removeUnnecessaryContent,
  sleep,
} = require('./utils');

const {
  concurrency,
  totalAmount,
  CPM,
  urls,
} = require('./configs/config.json');

puppeteer.use(StealthPlugin());

const url = urls[getRandomIntInclusive(0, urls.length - 1)];
const maxViews = (totalAmount * 1000) / CPM;
let currentViews = 0;
let active = 0;

const main = async () => {
  await sleep(getRandomIntInclusive(1000, 5000));
  let browser;
  let chrome;

  try {
    chrome = await chromeLauncher.launch({
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

    const page = await browser.newPage();
    await removeUnnecessaryContent(page);

    const response = await handlePage(page, currentViews, url);
    if (response.increseViews) currentViews += 1;

    console.log(
      '\x1b[42m\x1b[30m%s\x1b[0m\x1b[32m%s\x1b[0m',
      ' SUCCESS    ',
      ` Found an AD! Views (${currentViews}), Actives (${active})`,
    );

    // treekill(chrome.pid, 'SIGKILL');
    await chrome.kill();
  } catch (error) {
    // treekill(chrome.pid, 'SIGKILL');
    await chrome.kill();
  }
};

const loop = async () => {
  if (currentViews >= maxViews) return;

  if (active < concurrency) {
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
