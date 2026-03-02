# Phase 02 Deferred Items

## Pre-existing Issues

1. **Build fails without DATABASE_URL env var** -- `npm run build` fails at "Collecting page data" stage because API route handlers (e.g. `/api/accounts`) import the Drizzle db client which tries to connect at build time. This is a pre-existing issue from Phase 1. Fix: Either set DATABASE_URL in build env, or wrap db client in lazy initialisation. Not caused by Phase 2 changes.
