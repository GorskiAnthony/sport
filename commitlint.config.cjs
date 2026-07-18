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
  // semantic-release's auto-generated "chore(release)" commits embed the changelog entry
  // (including compare-link URLs) as the commit body, which routinely exceeds the 100-char
  // body-max-line-length rule — exempt them rather than weakening the rule for human commits.
  ignores: [(message) => /^chore\(release\):/.test(message)],
};
