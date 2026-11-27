# Imperial Premium V7 delivery

All 17 optimized WebP assets are committed and verified against the original full ZIP SHA-256 manifest. The 10 original source PNGs are retained in the full delivery archive, not yet transferred to GitHub. Archive: wedding-imperial-premium-v7-full.zip; SHA256 e5da262222515a4f3808bceae27c26fd4424c7ae745ff95f2537ae5fd377cf70. See assets/imperial-premium-v7/manifest.json.

V7 integrates the real artwork, a responsive frame, imperial palace backdrop, curtain, decorative ornaments and 17-image gallery. Original couple portrait, music, V6 RSVP, invitation code, admin, backups and database are preserved. The activation tool verifies the WebP manifest; the optional full ZIP importer is intended for a clean destination only. Do not overwrite an existing web asset directory. Source archival is separate from deployment.

Regression: node tools/test-wedding-v5.cjs; node tools/test-wedding-v6.cjs; node tools/test-wedding-server-browser.cjs; node tools/test-wedding-v4.cjs. Chrome QA forces lazy images to load for image decode validation. Deploy only verified main SHA with backup, readiness, and rollback to V6.
