/* eslint-disable no-console */
const { appendFileSync } = require('fs');

const handleDeprecated = (userAgent) => {
  console.log(
    '\x1b[41m\x1b[30m%s\x1b[0m\x1b[31m%s\x1b[0m',
    ' DEPRECATED ',
    ' The browser is deprecated, saving into txt.',
  );
  appendFileSync('deprecated.txt', `\n${userAgent}`);
};

module.exports = handleDeprecated;
