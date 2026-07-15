# Nyumban Field

I built Nyumban Field as an offline-first React Native application for agents performing residential property inspections in unreliable network conditions.

I am maintaining this README alongside the implementation. It records the decisions I made, the trade-offs I accepted, unfinished work, and known problems rather than serving only as a feature list.

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

Still using static data:

- Inspection progress and sync queue.

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

The `.env` file is ignored by Git. I am aware that the key is necessarily present in the compiled client application, but I do not store it in this repository.

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

Jest currently fails before executing tests because the generated scaffold references a missing `@react-native/jest-preset`. I have kept this visible as known work instead of hiding it by removing the test command.

## Decisions and trade-offs

### Bare React Native

I chose the React Native community CLI because the app needs native dependencies for SQLite, secure credential storage, navigation screens, and camera/library access.

### SQLite instead of a large AsyncStorage document

The API contains roughly 5,000 properties. I chose Nitro SQLite because it provides indexed local queries, transactions, foreign keys, and asynchronous work off the JavaScript thread. AsyncStorage remains installed, but I do not use it as the source of truth for portfolio or inspection data.

I separated the schema into:

- Properties and rooms.
- Inspections and per-room entries.
- Local photo evidence and server upload identifiers.
- Local sync status, validation failures, and conflict snapshots.

I use SQLite's `user_version` for migrations and execute each migration transactionally. I also enable WAL mode and a busy timeout during startup.

### Local-first inspection state

My intended data path is:

```text
Screens → SQLite → durable sync queue → API
```

I will not treat a network response as the working copy of an inspection. Draft edits must first be committed locally so the app can survive termination, airplane mode, and ambiguous server responses.

### Authentication and rotating refresh tokens

I store access and refresh tokens in Android Keystore/iOS Keychain rather than plain AsyncStorage. Refresh operations share one in-flight promise. This prevents two callers from spending the same single-use refresh token and revoking the server session.

The app restores the stored session on startup and refreshes one minute before access-token expiry. If restoration fails, I clear the local session credentials and return the agent to login.

### Photo scope

I currently allow one photo per room. This keeps memory use, upload volume, and the API's approximately 200-photo account quota bounded. I compress and resize photos through the picker and reject files over the API's 5 MB limit locally.

### Property cache and pagination

I render the cached property list first, then refresh the first API page when a session is available. Each page is upserted in a transaction and its opaque next cursor is stored in database metadata. Scrolling requests the next page, while pull-to-refresh starts again at the first page without deleting older cached records.

Search queries SQLite rather than depending on the network. If a request fails, I keep the existing cache and label the screen as offline instead of replacing valid data with an empty state. Opening a property follows the same approach: render its cached record, request fresh detail and rooms, then update the screen from SQLite.

## What I have deliberately not built yet

- Durable inspection draft repositories.
- Photo upload and inspection submission workers.
- Retry policy for `429`, `500`, and `503` responses.
- Conflict resolution UI for stale property versions.
- Reconciliation against server inspection history.
- Background synchronization.
- Final release APK and signing configuration.

## Known issues

- Inspection and sync content is still mock data.
- Room condition selection and photo choice are not yet persisted to SQLite.
- The sync screen is visual only.
- Jest configuration is incomplete as described above.
- Native Android compilation of the SQLite dependency has not yet been verified in this environment because Gradle cache access was not granted.

## My next implementation slice

My next slice is durable inspection drafts and per-room entries. I will make condition, notes, and photo selections commit to SQLite immediately, then drive the progress screen from that local state instead of mock activity.
