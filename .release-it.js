require('dotenv').config();

module.exports = {
  git: {
    requireCleanWorkingDir: false,
    commitMessage: 'chore(release): v${version}',
    tagName: 'v@${version}',
    push: false,
  },

  github: {
    release: true,
    releaseName: 'v${version}',
    releaseNotes: token => {
      return token.changelog || 'Initial release or no changes detected.';
    },
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'conventionalcommits',
      infile: 'CHANGELOG.md',
    },
  },
  npm: {
    publish: false,
  },
};
