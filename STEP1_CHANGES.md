# Step 1 – backend fixes
- CORS: explicit origins from `CORS_ORIGINS` (was `*` + credentials).
- `DELETE /api/cases/reset` and `DELETE /api/cases/{id}` need `X-Admin-Key` when `ADMIN_API_KEY` is set; blocked in production without it (`backend/security.py`).
- AI copilot: rule-based fallback now states only counts/degrees, no invented claims; responses include `evidence` (entity IDs) and `fallback_reason`; prompt treats graph data and question as data (prompt-injection hardening); question capped at 1000 chars; request validated by `GraphAIChatRequest`.
- Default model `gemini-2.5-flash` (override with `GEMINI_MODEL`).
- `.dockerignore` so `.env` and `.venv` are not baked into the image.
- README corrected to match the code. Tests: 216 passing (5 new).
- `.env` removed from this package. Rotate the Gemini key that was in your zip.
