# Forgejo and GitHub Actions

Forgejo PR #4 removed `.forgejo/workflows`, so Forgejo loaded the GitHub
workflows instead. The failed runs at `da63662` were:

| Job | Observed failure | Fix |
| --- | --- | --- |
| CI | TS6133: unused `Component` and `React` imports | Bring the PR branch forward to the fixes already merged on GitHub |
| Browser review | Production build failed on the same imports | Same import fixes |
| Dependency review | `data.forgejo.org/actions/dependency-review-action` does not exist | Run `npm audit --audit-level=moderate` |
| Benchmarks | `data.forgejo.org/CodSpeedHQ/action` does not exist | Run the repository's Vitest benchmarks and retain their output |

CI and browser review also warned that the npm cache service was unreachable.
Forgejo dependency setup uses no GitHub cache service. Forgejo artifacts use
the native upload action v3, rather than GitHub's artifact service v4.
Dependency setup uses npm 11.21.2 and explicitly includes optional dependencies,
which supply Lightning CSS and Tailwind's required platform bindings. The
post-merge benchmark run failed when Lightning CSS's Linux binding was absent.

The first native runs also exposed a hardware failure: Rolldown's native
binding exits with `SIGILL` on Lenovo's Intel i3-3110M, which lacks AVX2.
Dependency setup probes Rolldown in a child process and selects its pinned,
matching WASI binding only for this failure. Supported runners retain the
native binding; other setup errors remain failures. Benchmark output is
retained even when a benchmark fails.
Browser checks explicitly select Chromium's SwiftShader WebGL adapter so
headless runners exercise the scenes as well as the static layout.
CI gives software rendering additional test time. The combined card fanning,
reversal, and resize regression takes over a minute on the Lenovo CPU.
Resize checks wait for Chromium's viewport frame before checking the static
layout. Browser jobs print failures immediately and retain HTML
reports; the first unrecovered failure stops the run for diagnosis.
Responsive layouts subscribe synchronously to media-query changes so a
short-screen resize does not retain an obsolete animated layout while React
processes ongoing scroll updates. They read live query snapshots on resize
and on the following frame, including when a retained query's notification
is delayed.
The existing Forgejo Semgrep workflow is also restored for pull requests,
main pushes, and the weekly scan. The old `code-review.yml` is replaced by
the pinned `ai-review.yml` so each PR gets one automated code review.
The restored scan identified 15 mutable GitHub action references. All are
now pinned to verified release commits, including dependency review v4.9.0
because the upstream movable `v4` tag no longer exists.
GitHub's reviewer now tries Codestral first and includes the runner topology
and action-pinning policy in its trusted system prompt. Findings must identify
a concrete defect; a pinned version or a private Forgejo URL alone is not one.

Every portable GitHub job has a Forgejo counterpart:

| GitHub workflow/job | Forgejo workflow/job |
| --- | --- |
| `ci.yml / ci` | `ci.yml / ci` |
| `pr-review.yml / dependency-review` | `pr-review.yml / dependency-review` |
| `pr-review.yml / browser-review` | `pr-review.yml / browser-review` |
| `codspeed.yml / benchmarks` | `benchmarks.yml / benchmarks` |
| `ai-review.yml / ai-review` | `ai-review.yml / ai-review` |
| `deploy.yml / build` | `deploy.yml / build` |
| `deploy.yml / deploy` | GitHub Pages is a GitHub service; Forgejo publishes the validated deployment bundle as an artifact |

Forgejo jobs use `ci-standard`. The pinned AI review action retrieves the API
diff without executing PR source and uses the automatic run token. External
LLM review uses the existing Gemini secret when configured; the trusted action
has a rules-based fallback. Fork PRs do not receive reviewer secrets.
The internal review and scanning templates use the trusted HTTPS endpoint at
`https://forgejo.kepr.dev`; they remain pinned to immutable commits.

GitHub jobs explicitly require `github.server_url == 'https://github.com'`.
The live website continues to deploy through GitHub Pages when changes merge
to GitHub `main`. Changes to a Forgejo PR branch do not publish the website.

## Private HTTPS and API access

`forgejo.kepr.dev` resolves to Lenovo's private LAN address, `192.168.1.4`.
DNS validation can issue a publicly trusted certificate without opening the
Forgejo server to the internet. The domain currently uses Namecheap DNS.

The installed kepr gate's generic HTTP API route requires HTTPS on port 443
and accepts compiled-in public CA roots. A self-signed certificate for
`lenovo.local` would not enable authenticated API calls through this gate.

The activation script in `ops/forgejo/activate-https.sh` requires an issued
certificate and administrator access on Lenovo. It binds the proxy to the
LAN address, preserves port 3000 for existing runner connections, and updates
Forgejo's canonical URL. Certificate issuance uses DNS-01; manual DNS
validation also requires a manual renewal until a DNS API hook is configured.

The prepared certificate client is installed under
`/home/kk/.local/state/kk-forgejo-https/venv` on Lenovo. Its DNS verification
prompt is in `certificate-output.log` beside it. After issuance, activate in
an operator terminal:

```sh
ssh -t kk@lenovo.local 'sudo bash /home/kk/.local/state/kk-forgejo-https/activate-https.sh'
```

Namecheap has an A record for `forgejo` pointing to `192.168.1.4`. Clients
whose DNS resolver filters private addresses can use local DNS or a hosts
entry. Access from outside the LAN requires a VPN into the home network or
an independently configured remote access service. The hostname and
certificate alone do not provide internet reachability.

A Let's Encrypt certificate was issued on November 10, 2026 and expires on
February 7, 2027. Renew it before that date and repeat activation to install
the new certificate. DNS-01 validation needs only a public TXT record;
Forgejo does not need to be exposed to the internet.

After HTTPS is verified, the operator can seal a Forgejo API token:

```sh
kepr agent add FORGEJO_API_TOKEN --for forgejo.kepr.dev:bearer
```

Use a token restricted to the required repositories and API permissions.
The intended credential path is Kepr MCP `call_api`, with provider
`https+forgejo.kepr.dev+FORGEJO_API_TOKEN`. The gate already supports validated
custom HTTPS bindings, but the inspected `kepr mcp` wrapper currently registers
only built-in providers. It needs custom binding support before this provider
can be used; HTTPS and sealing a token alone do not complete the integration.
No token belongs in source, `.env`, command arguments, or chat.

Codex supports [stdio and HTTP MCP servers](https://developers.openai.com/codex/mcp/).
Run the credential-owning MCP server outside the isolated agent namespace,
where it can reach its approved credential service, and expose it through
the host integration. This session currently has no Kepr MCP tool available;
running a new MCP process inside the isolated namespace cannot grant daemon
access. Keep the current gate running and resume with the configured host
integration when ready.
