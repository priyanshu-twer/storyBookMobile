require('dotenv').config();

module.exports = {
  git: {
    requireCleanWorkingDir: false,
    commitMessage: 'chore(release): v${version}',
    tagName: 'v${version}',
    push: false,
  },

  github: {
    release: true,
    releaseName: 'v${version}',
    releaseNotes: token => {
      return token.changelog || 'Initial release or no changes detected.';
    },
    tokenRef: 'GITHUB_TOKEN',
  },

  npm: {
    publish: false, // set true if you want automatic npm publish and provide NPM_TOKEN
  },
};