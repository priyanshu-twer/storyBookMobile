
// Basic release-it configuration (place at repo root)
module.exports = {
  git: {
    requireCleanWorkingDir: true,
    commitMessage: 'chore(release): v${version}',
    tagName: 'v${version}',
    push: true,
  },

  github: {
    release: true,
  },

  npm: {
    publish: false, // set true if you want automatic npm publish and provide NPM_TOKEN
  },

  changelog: {
    infile: 'CHANGELOG.md',
  },

  hooks: {
    'before:init': ['npm test'], // run tests before releasing
    'after:release': 'echo "Released ${version}"',
  },

  // safe defaults
  ci: false,
};