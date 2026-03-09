# mindmap-license-server

This is a **minimal** licensing server for the Obsidian mindmap plugin (VPS / 轻量服务器):
- Online activation (`/activate`) returns an **offline signed license** (Ed25519)
- Offline grace handled on client (plugin): **7 days**
- Seats: **3 devices** enforced server-side
- Version entitlement: `maxVersion` (semver, inclusive)

## Server entry

- entry: `src/app.ts`
- build output: `dist/app.js`
- deployment: see `hk_light_server_runbook.md` and `aliyun_deployment.md`

## Setup (local)

```bash
npm install
npm run db:init
npm run gen:keys
npm run dev
```

## Database notes (MySQL)

- `npm run db:init` uses Sequelize `sync({ alter: true })` (OK for small deployments).
- If you already have an existing database created from an older schema (without `max_version`), run this migration SQL once:

```sql
-- activation_keys: add max_version + backfill from legacy max_major
ALTER TABLE activation_keys
  ADD COLUMN max_version VARCHAR(32) NOT NULL DEFAULT '0.0.0',
  ADD KEY idx_activation_keys_max_version (max_version);

UPDATE activation_keys
  SET max_version = CONCAT(max_major, '.999.999')
  WHERE max_version = '0.0.0' OR max_version IS NULL;

-- licenses: add max_version + backfill from legacy max_major
ALTER TABLE licenses
  ADD COLUMN max_version VARCHAR(32) NOT NULL DEFAULT '0.0.0',
  ADD KEY idx_licenses_max_version (max_version);

UPDATE licenses
  SET max_version = CONCAT(max_major, '.999.999')
  WHERE max_version = '0.0.0' OR max_version IS NULL;
```

## Admin: create an activation key

Permanent key (default):

```bash
curl -X POST http://127.0.0.1:3000/admin/create-key \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maxVersion":"0.2.999"}'
```

7-day trial key:

```bash
curl -X POST http://127.0.0.1:3000/admin/create-key \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maxVersion":"0.2.999","seats":3,"validDays":7}'
```

Response:

```json
{
  "key": "ABCD-EFGH-IJKL-MNOP",
  "maxVersion": "0.2.999",
  "seats": 3,
  "expiresAt": "2026-03-08T12:00:00.000Z"
}
```

## Activation key generation flow

1. Admin calls `POST /admin/create-key` with `maxVersion` and optional `seats` / `validDays` / `neverExpires`.
2. Server generates a random 16-char key, formats it as `XXXX-XXXX-XXXX-XXXX`.
3. Server infers `maxMajor` from `maxVersion` and stores the key in `activation_keys`.
4. If `validDays` is provided, server writes `expiresAt`; otherwise key is permanent (`expiresAt=null`).
5. Response returns `{ key, maxVersion, seats, expiresAt }` for distribution.

## Request examples (curl / JSON)

### Activate license

```bash
curl -X POST http://127.0.0.1:3000/activate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ABCD-EFGH-IJKL-MNOP",
    "deviceId": "device-123",
    "deviceName": "My Laptop",
    "appVersion": "0.2.1"
  }'
```

Response:

```json
{ "payloadB64": "...", "sigB64": "..." }
```

### Refresh license

```bash
curl -X POST http://127.0.0.1:3000/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "payloadB64": "...",
    "sigB64": "...",
    "deviceId": "device-123",
    "deviceName": "My Laptop",
    "appVersion": "0.2.1"
  }'
```

Response:

```json
{ "payloadB64": "...", "sigB64": "..." }
```

### Deactivate device (admin)

```bash
curl -X POST http://127.0.0.1:3000/admin/deactivate-device \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "licenseId": "lic_XXXXXXXX",
    "deviceId": "device-123"
  }'
```

## Plugin configuration

In the Obsidian plugin settings (License section):
- `License server base URL`: your HTTPS domain (e.g. `https://license.example.com`)
- `License public key (base64)`: `LICENSE_PUBLIC_KEY_B64`
- `Activation key`: the key created above

Then click `Activate`.

## Endpoints

- `POST /activate` { key, deviceId, deviceName, appVersion }
- `POST /refresh` { payloadB64, sigB64, deviceId, deviceName, appVersion }
- `POST /admin/create-key` { maxVersion, seats?, validDays?, neverExpires? } (requires `Authorization: Bearer <ADMIN_TOKEN>`)
- `POST /admin/deactivate-device` { licenseId, deviceId } (requires admin token)

## Signed license payload

`/activate` and `/refresh` return:

```json
{ "payloadB64": "...", "sigB64": "..." }
```

The decoded payload (JSON) includes:
- `licenseId`: license identifier
- `seats`: allowed device count
- `maxVersion`: semver upper bound (inclusive), e.g. `0.2.999`
- `nextCheckAt`: unix ms timestamp when the client must refresh online (offline grace window)
- `issuedAt`: unix ms timestamp
- `maxMajor` (optional): legacy field for backward compatibility

## Error responses

All errors return a stable machine-readable shape:

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": { "optional": true }
  }
}
```

Common error codes:
- `INVALID_REQUEST` (400): request validation failed
- `ACTIVATION_KEY_NOT_FOUND` (404)
- `ACTIVATION_KEY_DISABLED` (403)
- `ACTIVATION_KEY_EXPIRED` (403)
- `LICENSE_NOT_FOUND` (404)
- `VERSION_NOT_ALLOWED` (403)
- `SEATS_EXCEEDED` (409)
- `INVALID_SIGNATURE` (403)
- `INVALID_PAYLOAD` (400)
- `INVALID_SIGNED_LICENSE` (400)
- `DEVICE_NOT_FOUND` (404)
- `CORS_BLOCKED` (403)
- `NOT_FOUND` (404): unknown route

