# Contributing to Resonate AI

Thanks for considering a contribution. This project is a self-hostable SaaS
app — the principles below favor changes that are easy to deploy, easy to
inspect, and easy to revert on a remote box with `docker compose pull`.

## Code of Conduct

This project and everyone participating in it is governed by
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). By signing a commit, you agree to
uphold it. Report unacceptable behavior to iamcoder18@gmail.com.

## How can I help?

- **Bug reports**: use the [bug report template][issue-bug]. Include the
  commit SHA, deployment flavor, and the full error text — paraphrased
  errors usually lose the useful part.
- **Feature requests**: use the [feature request template][issue-feat].
  Mark the "willingness to contribute" box so maintainers can gauge where
  help is needed.
- **Pull requests**: bug fixes, doc fixes, and small refactors are almost
  always welcome. For larger features, open an issue (or discussion) first
  so the design can be agreed before code is written.

[issue-bug]: https://github.com/IamCoder18/resonateai/issues/new?template=bug_report.md
[issue-feat]: https://github.com/IamCoder18/resonateai/issues/new?template=feature_request.md

## Development setup

Easiest path:

```bash
cp .env.example .env            # then fill BETTER_AUTH_SECRET, SMTP_*, etc.
docker compose up --build       # web + postgres + garage + garage-init
```

The web container's entrypoint waits for Postgres, runs `drizzle-kit push`,
then starts Next.js. Hot reload is enabled via the volume mount in
`docker-compose.yml`.

If you'd rather run pieces on the host:

```bash
cd web && npm install
npm run dev                     # terminal 1  (uses web/.env)
DATABASE_URL=postgres://... npm run db:push   # terminal 2  (apply schema)
```

### Tooling

- Node 20+
- pnpm is fine; the lockfile is `package-lock.json` so use npm unless you're
  switching the whole repo to pnpm.
- `npm run lint` and (in `web/`) `npx tsc --noEmit` are the project's static
  checks; please run them locally before opening the PR.

### Building the mobile app

The Capacitor shell lives under `android/` and loads a static export of
`web/src/app/app/*` inside a WebView. Full pipeline is in
[web/MOBILE.md](./web/MOBILE.md). Short version:

```bash
npm run mobile:build      # writes web/out
npm run mobile:sync       # cap sync android
npm run mobile:assemble   # debug APK (no signing config)
```

A signed release APK needs the `RESONATE_KEYSTORE_*` properties set in
`~/.gradle/gradle.properties` (see `web/MOBILE.md`).

## Pull request process

1. Branch off `main`. Keep the history linear — `git pull --rebase` before
   pushing.
2. Use the PR template. The `## Context` section is the most important:
   answer *why*, not just *what*.
3. Make sure `npm run lint` is clean and the type check passes.
4. If your change touches the database schema (`web/src/db/schema.ts`),
   include the `drizzle-kit` migration under `web/src/db/migrations/`
   in the same PR. `npm run db:generate` produces one.
5. If your change is in the mobile bundle (any file under `web/src/app/app/`
   or `web/src/components/mobile-*`), run `npm run mobile:build` and confirm
   the export still contains the affected route.
6. Squash or rebase into a small number of well-titled commits before merge.
   Maintainer may ask you to squash.

## Reporting security issues

**Do not file a public issue.** Use
[GitHub Security Advisories][advisories] or email iamcoder18@gmail.com. See
[SECURITY.md](./SECURITY.md) for the full disclosure policy, supported
versions, and response targets.

[advisories]: https://github.com/IamCoder18/resonateai/security/advisories/new

## License

By contributing, you agree that your contributions will be licensed under the
project's [MIT License](./LICENSE).
