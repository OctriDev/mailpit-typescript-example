# Validation

Validated locally on 2026-10-06 against production build `6ac50a0f219b10381f66a227`.

| Check | Result |
| --- | --- |
| Native formatter | PASS, zero remaining formatter diff |
| Lint/static analysis | PASS |
| Type check/build | PASS |
| Generated native/runtime tests | PASS, 55 tests passed |
| Generated mock contract suite | PASS, 25/25 routes, 27 response modes, 123 checks, zero skipped routes |
| Packaging | PASS |
| Clean consumer installation | PASS |
| Real Mailpit v1.31.4 | PASS, send, inbox list, search, full message, text, HTML, binary attachment |
| Deterministic source preparation | PASS, identical output on two preparations |

Local runtime: Node.js 24.15.0 on macOS arm64. The consumer example checks public response names, explicit null recipient arrays, and exact binary bytes. The TypeScript consumer also compiles against the installed package declarations.

GitHub Actions runs the generated five-stage quality workflow plus a clean package-consumer/live-server workflow. The latter covers Node.js 22. Consult the latest successful checks on the exact repository commit for those results.

The generated contract suite exercises every route against its schema-derived mock. The live server test covers seven operations and their JSON/text/HTML/binary boundaries. Server-dependent functions such as SMTP relaying, SpamAssassin, external link checking, and image thumbnail generation are not live-tested. No production-readiness claim is made for those integrations.

Source preparation and the TypeScript anonymous-response workaround are documented in README.md and generation.json. The generator's general anonymous-response decoding limitation remains outside this example's scope.
