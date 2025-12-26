# Contributing to pmtiles-offline

Thank you for your interest in contributing to pmtiles-offline!

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for semantic versioning. The commit message format determines the version bump:

### Commit Types

- `feat:` - A new feature (triggers MINOR version bump, e.g., 1.0.0 → 1.1.0)
- `fix:` - A bug fix (triggers PATCH version bump, e.g., 1.0.0 → 1.0.1)
- `docs:` - Documentation changes only (no version bump)
- `style:` - Code style changes (formatting, missing semicolons, etc.) (no version bump)
- `refactor:` - Code changes that neither fix bugs nor add features (no version bump)
- `perf:` - Performance improvements (triggers PATCH version bump)
- `test:` - Adding or updating tests (no version bump)
- `chore:` - Changes to build process or auxiliary tools (no version bump)
- `ci:` - CI configuration changes (no version bump)

### Breaking Changes

Add `BREAKING CHANGE:` in the commit body or append `!` after the type to trigger a MAJOR version bump (e.g., 1.0.0 → 2.0.0):

```
feat!: change IndexedDBSource API to accept configuration object

BREAKING CHANGE: The constructor signature has changed from
`new IndexedDBSource(db, filename, tablename)` to
`new IndexedDBSource(config)`.
```

### Examples

```bash
# Patch release (1.0.0 → 1.0.1)
git commit -m "fix: resolve issue with blob storage in Safari"

# Minor release (1.0.0 → 1.1.0)
git commit -m "feat: add method to list all stored PMTiles files"

# Major release (1.0.0 → 2.0.0)
git commit -m "feat!: redesign API for better performance

BREAKING CHANGE: The getBytes method now requires an options object
instead of individual parameters."

# No release
git commit -m "docs: update README with new examples"
git commit -m "chore: update dependencies"
```

## Pull Request Process

1. Fork the repository and create a feature branch
2. Make your changes following the commit message convention
3. Ensure all tests pass: `npm test`
4. Ensure the build succeeds: `npm run build`
5. Submit a pull request to the `main` branch

The PR title should also follow the conventional commit format, as it will be used if the PR is squashed.

## Automated Releases

Releases are **fully automated** based on your commit messages. When you push to `main`, the workflow analyzes your commits and automatically handles versioning and publishing.

### How It Works

1. **Commit your changes** using conventional commit format
2. **Push to `main`** (or merge a PR)
3. **Automation takes over**:
   - Analyzes commits since last release
   - Determines version bump based on commit types
   - Updates `package.json` and `package-lock.json`
   - Creates a git tag (e.g., `v1.2.3`)
   - Publishes to NPM
   - Creates a GitHub release with auto-generated changelog
   - Updates `CHANGELOG.md`
   - Commits version changes back to the repository

### Version Determination

The version bump is automatically determined by your commit messages:

- **Patch** (1.0.0 → 1.0.1): `fix:` commits
- **Minor** (1.0.0 → 1.1.0): `feat:` commits
- **Major** (1.0.0 → 2.0.0): `BREAKING CHANGE:` or `!` suffix

### Example Workflow

```bash
# Make your changes
git add .
git commit -m "feat: add method to delete stored PMTiles files"
git push origin main

# The workflow automatically:
# - Bumps version to 1.1.0 (minor release for new feature)
# - Creates tag v1.1.0
# - Publishes pmtiles-offline@1.1.0 to NPM
# - Creates GitHub release v1.1.0
# - Updates CHANGELOG.md
```

### Skipping Releases

If you want to commit without triggering a release, use commit types that don't trigger releases:

```bash
git commit -m "docs: update README examples"
git commit -m "chore: update dependencies"
git commit -m "ci: improve workflow performance"
```

These commits will be included in the next release but won't trigger one on their own.
