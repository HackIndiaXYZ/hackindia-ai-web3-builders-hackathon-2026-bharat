# Bharat Apadha Prabandhak: Project Guide

This guide explains the project for someone seeing it for the first time. It covers the technology, the important folders, how the app starts, what each screen does today, and which parts are still prototypes.

## 1. What this project is

Bharat Apadha Prabandhak is an offline-first disaster-response mobile app prototype for India. Its interface brings together:

- Local emergency contacts
- Alert creation and viewing
- A response map with shelters, hospitals, relief camps, and community reports
- A small offline language phrase pack
- A local safety assistant
- Public and private message screens

The app is designed to keep its core state on the device so it can continue to display and create information when connectivity is unavailable.

The main application is located in the `bharat-apadha-prabandham` folder:

| Folder | What it is |
| --- | --- |
| `bharat-apadha-prabandham` | The primary React Native + Expo app. This is the app started by the Replit Expo workflow. |

## 2. Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| App framework | React Native | Shared UI for Android, iOS, and web |
| Expo | Expo SDK 57 | Native APIs, development server, builds, and platform integration |
| Navigation | Expo Router | File-based routes inside the `app/` folder |
| Language | TypeScript | Typed application code |
| State | React Context + React hooks | Shared alerts, contacts, chats, map reports, and offline status |
| Persistence | `@react-native-async-storage/async-storage` | Saves the local app state between launches |
| Maps | `react-native-maps` on native; custom view on web | Native map rendering and a web-compatible visual fallback |
| UI | React Native components, Expo Blur, Feather icons | Cross-platform interface and styling |
| Fonts | Inter via `@expo-google-fonts/inter` | Typography loaded before the main screen appears |
| Data fetching | `fetch` to Open-Meteo | Current temperature on the Home screen |
| Query library | TanStack React Query | Provider is installed globally for future server-backed data |
| Static serving | Node.js server in `server/serve.js` | Serves generated Expo web output |

The Expo app currently uses Node.js 22, which is required by SDK 57.

## 3. How the app starts

The main package is:

```text
package.json
```

Its important scripts are:

```bash
npm run dev       # starts Expo/Metro development server
npm run typecheck # runs TypeScript without emitting files
npm run build     # creates a static Expo build through scripts/build.js
npm run serve     # serves the generated static build with Node.js
```

The Replit workflow runs the package from the repository root with:

```bash
pnpm --filter @workspace/bharat-apadha-prabandham run dev
```

For local development:

```bash
cd bharat-apadha-prabandham
pnpm install
pnpm dev
```

You can then:

1. Open the web preview when Expo prints a web URL.
2. Scan the Expo QR code with Expo Go for a physical-device preview.
3. Use an Android or iOS simulator if one is available.

## 4. Startup sequence

The app begins at `app/index.tsx`, which is the opening/landing screen. From there, the user enters the main application.

The root layout is `app/_layout.tsx`. It creates the providers that every screen can use:

1. Loads the Inter font family.
2. Prevents the splash screen from disappearing until fonts are ready.
3. Sets the system background color.
4. Wraps the app in `SafeAreaProvider`.
5. Adds the error boundary.
6. Adds the TanStack Query client provider.
7. Adds `AppProvider`, the application's local state store.
8. Adds gesture handling and keyboard handling.
9. Defines the Expo Router stack.

The tab layout is `app/(tabs)/_layout.tsx`. It provides four tabs:

- Alerts
- Home
- Translator
- Map

The floating `AiFab` button is visible from the tab layout and opens the safety assistant.

## 5. Shared state and persistence

The main state store is `context/AppContext.tsx`.

It owns:

- `alerts`
- `contacts`
- `publicMessages`
- `privateMessages`
- `crowdMarkers`
- `isOffline`

The store starts with empty arrays/objects from `constants/data.ts`. It then attempts to load saved state from AsyncStorage using the key:

```text
bap-local-state-v2
```

After hydration, any state change is serialized back to AsyncStorage. This means contacts, alerts, messages, and map reports are local to the current app installation/device.

Important behavior:

- The app uses Supabase for its cloud database and authentication when online.
- A phone OTP authentication flow is provided via Supabase Auth (`lib/auth.ts`).
- Alerts, messages, and map markers sync with the Supabase backend when connected.
- The `isOffline` value determines whether to query Supabase or rely on local AsyncStorage.
- If saved JSON cannot be read and the network is unavailable, the app keeps safe built-in defaults.

## 6. What each screen actually does

### Home: `app/(tabs)/index.tsx`

The Home screen shows:

- The current temperature.
- A city label or “Your location”.
- An Offline ready/Connected status pill.
- The first two locally stored alerts.
- Emergency contacts.
- A link to the public community room.

Weather behavior:

1. The app starts with `28°` and `Bengaluru`.
2. If location permission is granted, it asks the device for the current coordinates.
3. It calls Open-Meteo:

   ```text
   https://api.open-meteo.com/v1/forecast
   ```

4. It displays the current temperature.
5. If the request fails, the previous display remains.

Contacts:

- A contact requires at least 10 digits.
- The normalized phone number is used as the local contact ID.
- Duplicate phone numbers are rejected.
- Removing a contact also removes its local private-message history.
- Selecting a contact opens `app/private-chat/[id].tsx`.

### Alerts: `app/(tabs)/alerts.tsx`

The Alerts screen lists locally stored alert records. A user can add an alert with:

- Title
- Location
- Description/body
- Severity: Critical, High, Moderate, or Low

The store adds the current time label, generates an ID, and marks the source as `Community verified`.

Alerts are synchronized with the Supabase database. When offline, alerts are stored locally and will be pushed to the backend once connectivity is restored.

### Map: `app/(tabs)/map.tsx`

The Map screen provides:

- A default region around Bhubaneswar.
- A current-location button using Expo Location permission.
- Hardcoded example locations:
  - Unit 6 Community Centre
  - Capital Hospital
  - Relief camp · School 3
- Community layer filters: All reports, Safe, and Danger.
- A form to add a Safe or Danger report.

Native behavior:

- `components/MapCanvas.native.tsx` uses `react-native-maps`.
- It draws markers, a polygon risk area, and a circular risk area.

Web behavior:

- `components/MapCanvas.tsx` is selected instead.
- It renders a stylized offline map-like canvas with positioned pins and risk blobs.
- It is not backed by map tiles or a geographic map service.

Crowd reports are generated locally with approximate coordinates near the default region and persist through AsyncStorage.

### Translator: `app/(tabs)/translator.tsx`

The Translator screen supports 13 language choices:

- English
- Hindi
- Bengali
- Tamil
- Telugu
- Marathi
- Gujarati
- Kannada
- Malayalam
- Punjabi
- Odia
- Urdu
- Assamese

The current implementation features a two-tier translation system:

- **Offline**: Uses an offline phrase lookup where English-to-English returns original text, and other languages return bundled disaster-safety sentences.
- **Online**: Arbitrary text translation is supported when connected, using a LibreTranslate instance self-hosted via Supabase Edge Functions.

### Safety assistant: `app/ai.tsx`

The assistant operates on a two-tier strategy:

1. **Local (Offline):** A deterministic, rule-based intent classifier with a curated knowledge base for disaster scenarios. It checks for keywords like `first aid`, `earthquake`, or `flood`.
2. **Remote (Online):** When connected, complex queries are routed to the Gemini API via a Supabase Edge Function.

This ensures zero-download instant responses offline, while unlocking full AI capabilities when online. Messages receive local hash labels and are displayed as verified.

### Public room: `app/public-chat.tsx`

The public room:

- Displays messages from the shared local state.
- Lets the current user add a message.
- Shows messages in reverse chronological order.
- Displays a local verification hash.

It supports multi-device delivery using two methods:
- **Cloud Sync:** Uses Supabase to synchronize messages across devices when online.
- **BLE Mesh:** Uses Bluetooth Low Energy (store-and-forward flooding) to relay messages between nearby devices when offline, as implemented in `lib/mesh.ts`.

### Private chat: `app/private-chat/[id].tsx`

Private chat is opened from an emergency contact. It:

- Uses the contact's phone number as the route ID.
- Displays that contact's locally stored messages.
- Lets the user append messages.
- Displays a hash label for each message.

Private chat utilizes end-to-end encryption. As implemented in `lib/crypto.ts`, it uses `expo-crypto` for X25519 Diffie-Hellman key exchange and AES-GCM symmetric encryption. Your private key stays on the device, while public keys are synced to Supabase.

## 7. Message verification

`lib/hash.ts` creates a short hash-like identifier from:

```text
sender + message text + timestamp
```

The implementation uses a small FNV-style integer hashing loop and returns values such as:

```text
BAP-XXXXXXXX
```

For public messages, this hash serves as an integrity check. For private messages, true end-to-end encryption is applied using X25519 and AES-GCM (see `lib/crypto.ts`), ensuring messages are secure and verifiable.

## 8. Styling and platform behavior

Colors live in `constants/colors.ts`, and `hooks/useColors.ts` exposes the selected palette to components. Shared UI primitives such as cards, buttons, status pills, and section headers live in `components/Primitives.tsx`.

The app uses:

- A dark navy background
- Teal/sage action colors
- Inter typography
- Safe-area-aware layouts
- Keyboard-aware input screens
- Native and web-specific map rendering

The Expo web target is supported, but it is a browser rendering of a React Native app. Native-only capabilities such as precise device location and native map behavior depend on the platform and permissions.

## 9. Current limitations and honest implementation status

While many features have been implemented, a few ideas remain as UI prototypes or are not fully connected to external production services:

- Live government alert feeds (currently community/user-driven)
- Live disaster forecasting (beyond basic Open-Meteo weather)
- Remote shelter/hospital data (currently hardcoded examples)

However, the following core features **are** implemented:
- **User accounts & identity:** Supabase Auth with Phone OTP.
- **Server-side storage & sync:** Supabase database for alerts, markers, and messages.
- **Bluetooth mesh transport:** BLE advertising and scanning for offline message flooding.
- **End-to-end encryption:** X25519 + AES-GCM for private chats.
- **AI & Translation:** Two-tier system (local rule-based + remote Gemini/LibreTranslate via Edge Functions).

The app serves as a robust hybrid prototype, gracefully falling back to local persistence and offline mesh when the network is unavailable.

## 10. Useful files to start reading

If you are new to the codebase, read these in order:

1. `package.json` — dependencies and commands.
2. `app/_layout.tsx` — global providers and navigation.
3. `context/AppContext.tsx` — shared state and persistence.
4. `constants/data.ts` — domain types and initial values.
5. `app/(tabs)/index.tsx` — main user flow.
6. `app/(tabs)/map.tsx` and `components/MapCanvas*.tsx` — platform-specific map behavior.
7. `app/ai.tsx` — local assistant behavior.
8. `lib/hash.ts` — message identifier generation.

## 11. Validation commands

From the Expo app directory:

```bash
npm run typecheck
npx expo-doctor@latest
npx expo export --platform web
```

The Replit workflow is the normal way to keep the development server running while working in the workspace.