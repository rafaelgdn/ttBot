const userAgents = require('./userAgents');
const getRandomIntInclusive = require('./getRandomIntInclusive');
const handleActions = require('./handleActions');
const { setDomainLocalStorage, removeUnnecessaryContent } = require('./interceptRequests');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  sleep,
  userAgents,
  getRandomIntInclusive,
  handleActions,
  setDomainLocalStorage,
  removeUnnecessaryContent,
};
