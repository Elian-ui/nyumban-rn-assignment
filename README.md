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
- Bounded detail prefetch for fully offline-ready loaded property pages.
- Local property search and cache-first property detail.
- Durable inspection drafts and per-room progress from SQLite.
- Autosaved room conditions, notes, and local photo metadata.
- Local completion validation and a durable queued state.
- App-owned photo storage that survives cache cleanup and process restarts.
- Ordered photo upload and inspection submission from the local queue.
- Stable idempotency keys, transient retries, conflicts, and rejection states.
- Automatic sync triggers on startup, foreground, and connectivity return.
- Persisted Auto sync preference with manual sync always available.
- Reconciliation against the agent's independently fetched server history.
- Unified inspection history for local work and reconciled server records.
- Guided recovery for property-version conflicts and server rejections.
- Android upload-key signing configuration for release APK builds.

## Running the app

### Prerequisites

- Node.js 22.11 or newer.
- JDK 17.
- Android Studio with the Android SDK, platform tools, and an emulator image.
- `ANDROID_HOME` configured and `adb` available on the command line.
- A personal Nyumban assessment key.

Confirm the local tools before continuing:

```sh
node --version
java -version
adb version
```

### Install and configure

From the repository root, install JavaScript dependencies:

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

### Run a debug build on Android

Start an Android emulator from Android Studio, or connect a physical device with USB debugging enabled. Confirm that Android Debug Bridge can see it:

```sh
adb devices
```

The device must be listed with the state `device`. Start Metro from the repository root in the first terminal:

```sh
npm start
```

Keep Metro running. In a second terminal, install and launch the debug application:

```sh
npm run android
```

The debug build uses `android/app/debug.keystore` and connects to Metro for its JavaScript bundle.

The shared test credentials are:

```text
agent@nyumban.test
Kireka2026!
```

The first authenticated property refresh downloads summary records and then prefetches room details for that loaded page. A property marked `Offline ready` can be opened and inspected without connectivity.

### Build a signed release

The upload keystore must remain outside version control. A keystore placed at `android/app/my-upload-key.keystore` is already covered by the repository's `*.keystore` ignore rule. Keep a secure backup of the file, alias, and passwords because future releases must use the same signing identity.

Store the signing values in the user-level `~/.gradle/gradle.properties`, not the repository's tracked `android/gradle.properties`:

```properties
NYUMBAN_UPLOAD_STORE_FILE=my-upload-key.keystore
NYUMBAN_UPLOAD_KEY_ALIAS=your-key-alias
NYUMBAN_UPLOAD_STORE_PASSWORD=your-store-password
NYUMBAN_UPLOAD_KEY_PASSWORD=your-key-password
```

The keystore filename and key alias are separate values. Check the alias when uncertain:

```sh
keytool -list -v -keystore android/app/my-upload-key.keystore
```

Build the installable release APK from the repository root:

```sh
cd android
./gradlew assembleRelease
cd ..
```

Generated artifact:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Install the APK directly on a connected device or emulator:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

If Android reports `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, the installed app uses a different signing key, usually the debug key. Uninstalling it deletes that installation's local drafts and cached data, so preserve anything needed before running:

```sh
adb uninstall com.nyumban
adb install android/app/build/outputs/apk/release/app-release.apk
```

The release APK contains its JavaScript bundle and does not require Metro.

### Publish an APK to GitHub Releases

The workflow at `.github/workflows/android-release.yml` builds and publishes a signed APK whenever a tag beginning with `v` is pushed. Configure these GitHub Actions repository secrets before creating a release:

```text
ASSESSMENT_KEY
ANDROID_KEYSTORE_BASE64
NYUMBAN_UPLOAD_KEY_ALIAS
NYUMBAN_UPLOAD_STORE_PASSWORD
NYUMBAN_UPLOAD_KEY_PASSWORD
```

Create the Base64 keystore value on macOS without committing the source file:

```sh
base64 -i android/app/my-upload-key.keystore | pbcopy
```

Paste the clipboard value into the `ANDROID_KEYSTORE_BASE64` secret. Publish a version from a clean commit by pushing a tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions installs dependencies, restores the private build inputs on its temporary runner, runs `assembleRelease`, and creates or updates the matching GitHub Release. The downloadable asset is named `nyumban-v1.0.0.apk`. Re-running the workflow for the same tag replaces that asset instead of creating a duplicate.

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

The API contains roughly 5,000 properties. Nitro SQLite was chosen because it provides indexed local queries, transactions, foreign keys, and asynchronous work off the JavaScript thread. AsyncStorage stores only the small Auto sync preference; it is not the source of truth for portfolio, authentication, or inspection data.

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

The list and detail endpoints have different payloads: list pages contain summaries, while rooms come from each property's detail endpoint. A nullable detail-cache timestamp distinguishes a saved summary from a fully offline-ready property, including properties that legitimately have no rooms. After a list page is stored, missing details are fetched with at most three concurrent requests and saved transactionally. Successful downloads remain complete if connectivity fails partway through, and only missing details are retried when that page is refreshed. A newer summary version invalidates the detail-ready marker and schedules that property for another detail fetch.

Prefetch is limited to pages already loaded by the agent. Automatically requesting detail for the entire portfolio of roughly 5,000 properties would create thousands of uncontrolled requests and increase rate-limit risk. The property list labels completed records as offline ready and reports summary-only records honestly until their rooms have been downloaded.

### Durable inspection drafts

Starting an inspection creates a local inspection record and one room-entry record per cached room in a single transaction. Reopening the property resumes the latest draft instead of creating another one. Room condition and note changes autosave to SQLite, while the explicit Save button provides a retry path when a local write fails.

Inspection progress is calculated from saved room entries rather than component state. Completing an inspection is only enabled after every room is complete, and completion moves the record to `queued` with its original property version and stable idempotency key intact.

### Photo storage and synchronization

Selected images are copied into the app documents directory before their database records are updated. Replacing or removing evidence also removes the previous app-owned file. This avoids depending on temporary camera or picker locations that the operating system may clear.

The sync worker is single-flight and processes inspections sequentially. Local photos upload first and each returned server ID is saved before the inspection is submitted. Inspection retries reuse the original idempotency key. `429`, `500`, and `503` responses receive bounded retry with `Retry-After` support; an exhausted transient failure returns the inspection to `queued` without deleting any local data.

Server conflicts and permanent validation or quota errors move records to explicit `conflict` or `rejected` states. Interrupted `syncing` and `uploading` states are recovered to retryable local states on the next run.

A conflicted inspection shows its local property version beside the current server version and requires explicit confirmation before being requeued against the server version. A rejected inspection shows available validation messages and can be reopened for correction with all room entries and photos preserved. Corrected submissions receive a fresh idempotency key so the API does not replay a stored rejection from the earlier request.

Connectivity state is treated as a trigger rather than proof that the API is reachable. Sync runs through one shared cycle on authenticated startup, when the app returns to the foreground, and when NetInfo reports a usable connection. Request failures remain authoritative and are handled by the queue policy above.

Auto sync is enabled by default and can be disabled from the Sync screen. The preference is stored locally and is loaded before automatic listeners begin work, preventing a disabled setting from triggering a startup sync. Disabling it stops startup, foreground, and connectivity triggers; the manual Sync now action and inspection-history pull-to-refresh remain available.

After local submissions are processed, reconciliation pages through `GET /inspections?agentId=` and stores the server's independent view in SQLite. Known local server IDs are confirmed as synced without relying solely on the state left by the original request.

The Inspections tab combines local drafts, queued work, conflicts, rejections, synced submissions, and independently retrieved server inspections. Server rows already linked to a local submission are de-duplicated. Pull-to-refresh runs the same serialized sync and reconciliation cycle before reloading the local history, while drafts can return directly to their saved inspection flow and attention states open the sync queue.

### Terminated-process background sync

Android WorkManager and Headless JS were considered for syncing while the application process is terminated. That implementation was deliberately deferred. The current foreground worker and token refresh guards are single-flight within one JavaScript runtime. A foreground runtime and a separately started headless runtime could otherwise refresh with the same single-use token concurrently, causing the API to revoke the entire session.

A safe implementation needs a cross-runtime SQLite lease for synchronization and token refresh, a native WorkManager scheduler with a network constraint, a Headless JS service, and a completion bridge so WorkManager receives the real JavaScript result. Adding only a connectivity receiver or starting a headless service without those controls would make delivery appear more reliable while introducing duplicate work and session-revocation failures.

Completed inspections remain durable in SQLite when the process is terminated. Sync resumes on the next authenticated launch, foreground transition, connectivity event received while the process is alive, or manual Sync now action. This preserves data and reports queue state honestly, while terminated-process scheduling remains a documented next step.

## Deliberately not built yet

- Background execution while the application is fully suspended.

## Known issues

- Sync is triggered automatically while the process is running, but Android background scheduling while fully suspended is not implemented.
- Jest configuration is incomplete as described above.
