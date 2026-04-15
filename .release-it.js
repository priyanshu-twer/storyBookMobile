require('dotenv').config();

module.exports = {
  git: {
    requireCleanWorkingDir: false,
    commitMessage: 'chore(release): v${version}',
    tagName: 'v${version}',
    push: true,
  },

  github: {
    release: true,
    releaseName: 'v${version}',
    tokenRef: process.env.GITHUB_TOKEN,
  },

  npm: {
    publish: false, // set true if you want automatic npm publish and provide NPM_TOKEN
  },
};