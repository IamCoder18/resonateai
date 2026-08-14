# Security Policy

## Supported versions

The `main` branch is the only release line. Security fixes are made against
`main` and shipped either as a new Docker image (`resonateai-web:latest` is
rebuilt on every push) or as a tagged release if one exists.

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅                 |
| older   | ❌ upgrade to main |

## Reporting a vulnerability

**Please do not file a public issue.** Use one of these channels instead:

- **GitHub Security Advisories** (preferred):
  https://github.com/IamCoder18/resonateai/security/advisories/new
- **Email**: iamcoder18@gmail.com (PGP not used — keep the report short,
  don't send exploit chains to a public-list inbox)

A good report includes:

1. What component is affected (web app, mobile app, `garage-init`, etc.)
   and the commit SHA.
2. How to reproduce — minimal steps, not a paragraph.
3. What an attacker gains (auth bypass, file read on the host, RCE, etc.).
4. Whether you've tested it against the latest `main`.

## Response targets

| Stage               | Target       |
| ------------------- | ------------ |
| Acknowledgement     | within 72 h  |
| Triage / scope      | within 1 wk  |
| Fix or mitigation   | depends on severity — critical (auth bypass, RCE, file disclosure) gets a patch release before a full investigation write-up; lower severity is bundled into the next regular push. |

You'll get credit in the fix commit and release notes unless you ask to
remain anonymous.

## Scope

In scope:

- The web app (`web/`), the mobile shell (`android/`, `capacitor.config.json`,
  `scripts/`), and the Garage / Postgres configuration in this repo
- Any Docker image rebuilt from this repo's Dockerfile

Out of scope:

- Garage itself (report upstream at https://git.deuxfleurs.fr/Deuxfleurs/garage)
- Better Auth (report upstream at https://github.com/better-auth/better-auth)
- Your deployment's reverse proxy, OS, or SMTP provider — those are your
  configuration, not this project's code
