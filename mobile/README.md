# LifeOS AI — Mobile (React Native + Expo)

The cross-platform mobile client for LifeOS AI. Built with **Expo SDK 56**, **React Native**, **TypeScript**, **React Navigation**, **React Query** and **Zustand** — sharing the same backend API as the web app.

## Features

- **Auth**: register / login with JWT access + refresh tokens stored in the device keychain (`expo-secure-store`) and automatic token refresh.
- **AI Assistant**: chat with persistent conversations, plus **text-to-speech** ("Speak replies") for hands-free use.
- **Tasks**: add, complete and delete tasks with priority badges.
- **Expenses**: income/expense entry, monthly totals, category breakdown bars, and one-tap **AI spending insights**.
- **Documents**: **scan with the camera** or **pick a file**, upload for extraction/classification, and **ask questions** about your documents (RAG).
- **Reminders**: create reminders, **attach your current GPS location**, and schedule an on-device **local notification** so it fires at the chosen time.
- **Push notifications**: registers an Expo push token on a real device (ready for server-delivered reminders).

### Native capabilities used
| Capability | Module |
|---|---|
| Push & local notifications | `expo-notifications`, `expo-device` |
| Camera capture | `expo-image-picker` |
| File upload | `expo-document-picker` |
| Location | `expo-location` |
| Voice output (TTS) | `expo-speech` |
| Secure token storage | `expo-secure-store` |

> Voice **input** (speech-to-text) requires a custom dev/EAS build with a native STT module (e.g. `@react-native-voice/voice`); the current build ships voice **output** (TTS), which works in Expo Go.

## Prerequisites

- Node 18+ and npm
- The LifeOS AI backend running (see the root README). For the **Android emulator** the app auto-targets `http://10.0.2.2:8080/api`; for a **physical device** it derives your machine's LAN IP from the Metro host. Override anytime with `EXPO_PUBLIC_API_URL`.

## Run (development)

```bash
cd mobile
npm install
npx expo start
```

Then press `a` (Android emulator), `i` (iOS simulator, macOS only), or scan the QR code with **Expo Go** on a physical device.

> The camera, push token and location features require a **physical device** (simulators have limited support). Everything else works in a simulator.

## Configure the API URL

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` when you need to point at a non-default backend (e.g. a deployed server):

```bash
cp .env.example .env
```

## Build installable apps (EAS)

`eas.json` defines three profiles:

- **development** – dev client for debugging on device.
- **preview** – produces a shareable **Android APK** (`buildType: apk`).
- **production** – Android **App Bundle** for the Play Store and an iOS build.

```bash
npm install -g eas-cli
eas login
eas init                 # links the project and fills extra.eas.projectId
eas build -p android --profile preview   # -> downloadable APK
eas build -p ios --profile production    # iOS (requires Apple credentials)
```

Set `EXPO_PUBLIC_API_URL` in each build profile's `env` (in `eas.json`) to your deployed backend before building for distribution.
