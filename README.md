# Nyumban Field

Nyumban Field is an offline-first React Native application for agents performing residential property inspections in unreliable network conditions.

This README is maintained alongside the implementation. It records the decisions made, accepted trade-offs, unfinished work, and known problems rather than serving only as a feature list.

## Current status

Implemented:

- Android-first inspection screen flow and typed native-stack navigation.
- Room condition, notes, and single-photo capture/library selection UI.
- Versioned SQLite database initialization and normalized domain models.
- Secure session persistence using Android Keystore/iOS Keychain.
- Login against the assessment API.
- Serialized refresh-token rotation and session restoration.
- Authenticated property retrieval with cursor pagination.
- Transactional property and room caching in SQLite.
- Local property search and cache-first property detail.
- Durable inspection drafts and per-room progress from SQLite.
- Autosaved room conditions, notes, and local photo metadata.
- Local completion validation and a durable queued state.

Still using static data:

- Sync queue content.

## Running the app

Requirements:

- Node.js 22.11 or newer.
- React Native Android development environment.
- A personal Nyumban assessment key.

Install dependencies:

```sh
npm install
```

Create the local environment file:

```sh
cp .env.example .env
```

Set the issued key in `.env`:

```text
ASSESSMENT_KEY=your-personal-key
```

The `.env` file is ignored by Git. The key is necessarily present in the compiled client application, but it is not stored in this repository.

Run Android:

```sh
npm start
npm run android
```

The shared test credentials are:

```text
agent@nyumban.test
Kireka2026!
```

## Verification

```sh
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

Jest currently fails before executing tests because the generated scaffold references a missing `@react-native/jest-preset`. This remains visible as known work instead of being hidden by removing the test command.

## Decisions and trade-offs

### Bare React Native

The React Native community CLI was chosen because the app needs native dependencies for SQLite, secure credential storage, navigation screens, and camera/library access.

### SQLite instead of a large AsyncStorage document

The API contains roughly 5,000 properties. Nitro SQLite was chosen because it provides indexed local queries, transactions, foreign keys, and asynchronous work off the JavaScript thread. AsyncStorage remains installed but is not the source of truth for portfolio or inspection data.

The schema is separated into:

- Properties and rooms.
- Inspections and per-room entries.
- Local photo evidence and server upload identifiers.
- Local sync status, validation failures, and conflict snapshots.

Migrations use SQLite's `user_version` and execute transactionally. WAL mode and a busy timeout are enabled during startup.

### Local-first inspection state

The intended data path is:

```text
Screens → SQLite → durable sync queue → API
```

A network response is not treated as the working copy of an inspection. Draft edits must first be committed locally so the app can survive termination, airplane mode, and ambiguous server responses.

### Authentication and rotating refresh tokens

Access and refresh tokens are stored in Android Keystore/iOS Keychain rather than plain AsyncStorage. Refresh operations share one in-flight promise. This prevents two callers from spending the same single-use refresh token and revoking the server session.

The app restores the stored session on startup and refreshes one minute before access-token expiry. A failed restoration clears local session credentials and returns the agent to login.

### Photo scope

The current UI allows one photo per room. This keeps memory use, upload volume, and the API's approximately 200-photo account quota bounded. Photos are compressed and resized through the picker, and files over the API's 5 MB limit are rejected locally.

### Property cache and pagination

The cached property list renders first, followed by a refresh of the first API page when a session is available. Each page is upserted in a transaction and its opaque next cursor is stored in database metadata. Scrolling requests the next page, while pull-to-refresh starts again at the first page without deleting older cached records.

Search queries SQLite rather than depending on the network. A failed request keeps the existing cache and labels the screen as offline instead of replacing valid data with an empty state. Opening a property follows the same approach: render its cached record, request fresh detail and rooms, then update the screen from SQLite.

### Durable inspection drafts

Starting an inspection creates a local inspection record and one room-entry record per cached room in a single transaction. Reopening the property resumes the latest draft instead of creating another one. Room condition and note changes autosave to SQLite, while the explicit Save button provides a retry path when a local write fails.

Inspection progress is calculated from saved room entries rather than component state. Completing an inspection is only enabled after every room is complete, and completion moves the record to `queued` with its original property version and stable idempotency key intact.

## Deliberately not built yet

- Photo upload and inspection submission workers.
- Retry policy for `429`, `500`, and `503` responses.
- Conflict resolution UI for stale property versions.
- Reconciliation against server inspection history.
- Background synchronization.
- Final release APK and signing configuration.

## Known issues

- Sync content is still mock data.
- The sync screen is visual only.
- Photo metadata is durable, but picker files still need to be copied from temporary locations into app-owned storage before the photo workflow can be considered crash-safe.
- Jest configuration is incomplete as described above.
- Native Android compilation of the SQLite dependency has not yet been verified in this environment because Gradle cache access was not granted.

## Next implementation slice

The next slice is durable photo-file storage followed by the ordered sync worker: upload local photos first, store their server IDs, then submit the inspection with its stable idempotency key. Queue, retry, rejection, and conflict states will replace the static sync screen content.
