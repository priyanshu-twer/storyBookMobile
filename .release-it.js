module.exports = {
  git: {
    requireCleanWorkingDir: false,
    commitMessage: 'chore(release): v${version}',
    tagName: 'bckwdw@${version}',
    push: false,
  },

  github: {
    release: true,
    releaseNotes: token => {
      return token.changelog || 'Initial release or no changes detected.';
    },
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'conventionalcommits',
      infile: 'CHANGELOG.md',
      ignoreRecommendBump: true
    },
  },
  npm: {
    publish: false,
  },
};
