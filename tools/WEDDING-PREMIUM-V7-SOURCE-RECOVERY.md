# V7 source recovery (no runtime changes)

The exact full ZIP was recovered from the delivery Library and all 27 asset SHA-256 digests were verified on 2026-11-27. The archive SHA-256 is `e5da262222515a4f3808bceae27c26fd4424c7ae745ff95f2537ae5fd377cf70`. This branch publishes the ten PNG master digests and a source-only importer, not the PNG bytes. The original V7 web-only manifest remains unchanged.

On WIN11-181, use a clean checkout of this branch and place the exact full ZIP in a local allowed directory. Run:

```powershell
.\tools\import-wedding-premium-v7-sources.ps1 -ZipPath C:\Work\wedding-imperial-premium-v7-full.zip -VerifyOnly
.\tools\import-wedding-premium-v7-sources.ps1 -ZipPath C:\Work\wedding-imperial-premium-v7-full.zip
 git add -- assets/imperial-premium-v7/sources
 git diff --cached --stat
````

Commit only the ten verified PNGs, push a dedicated branch, verify the remote SHA and review before merge. Do not import into production, change the current WebP directory, or publish the archive itself. No redeploy is required for source archival on the QS3D runtime. The repository is public; only generated artwork masters from the verified ZIP belong in this change, not personal photos, RSVP records or secrets.
