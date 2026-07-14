/**
 * Conventional Commits enforcement — required for semantic-release to determine
 * version bumps correctly (feat -> minor, fix -> patch, "BREAKING CHANGE" -> major).
 * Scope with the package name when relevant, e.g. "feat(backend): ..." / "fix(frontend): ...".
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['backend', 'frontend', 'mobile', 'ci', 'deps', 'release'],
    ],
  },
};
