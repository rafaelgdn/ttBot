/* eslint-disable no-underscore-dangle */
const blockedResourceTypes = [
  'Image',
  'image',
  'Font',
  'Texttrack',
  'Object',
  'Beacon',
  'Csp_report',
  'Imageset',
  'font',
  'texttrack',
  'object',
  'beacon',
  'csp_report',
  'imageset',
];

const skippedResources = [
  'quantserve',
  'adzerk',
  'doubleclick',
  'adition',
  'exelator',
  'sharethrough',
  'cdn.api.twitter',
  'google-analytics',
  'googletagmanager',
  'google',
  'fontawesome',
  'facebook',
  'analytics',
  'optimizely',
  'clicktale',
  'mixpanel',
  'zedo',
  'clicksor',
  'tiqcdn',
];

const removeUnnecessaryContent = async (page) => {
  try {
    const client = await page.target().createCDPSession();

    await client.send('Network.enable');
    await client.send('Network.setRequestInterception', {
      patterns: [{
        urlPattern: '*',
      }],
    });

    client.on('Network.requestIntercepted', async ({
      interceptionId,
      request,
      resourceType,
    }) => {
      const continueParams = { interceptionId };
      const requestUrl = request.url.split('?')[0].split('#')[0];

      if (
        blockedResourceTypes.indexOf(resourceType) !== -1
      || skippedResources.some((resource) => requestUrl.indexOf(resource) !== -1)
      ) {
        continueParams.errorReason = 'AddressUnreachable';
      }

      client.send('Network.continueInterceptedRequest', continueParams);
    });
  } catch (error) {
    throw new Error();
  }
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

module.exports = { removeUnnecessaryContent, setDomainLocalStorage };
