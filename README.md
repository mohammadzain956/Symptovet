# SymptoVet (Android-first, Expo + React Native)

A veterinary clinical **decision-support** app. This first version implements:

- ✅ **First-launch consent screen** — "suggestions only, not a diagnosis," which the user must accept once (stored with version + timestamp).
- ✅ **Clients (owners)** — add name + phone number; searchable list.
- ✅ **Patients (pets)** — add **multiple pets per client**, each with species, breed, and a **photo from camera or gallery**.
- ✅ **Next visit** — pick a **date & time** per client.
- ✅ **Reminders** — schedules a phone notification **and** keeps every reminder in an **in-app Reminders window**, so it stays visible even after you clear the notification from your phone's tray.

> The symptom→diagnosis engine, medication/dosing, imaging and lab records are the next phase — see `BUILD_PROMPT.md`. They need the veterinary book content first.

---

## How to run it (Android)

You don't have Node.js installed yet, so start there.

### 1. Install Node.js (one time)
Download the **LTS** installer from <https://nodejs.org> and run it. Then reopen your terminal and check:
```powershell
node -v
npm -v
```
Both should print a version number.

### 2. Install the app's dependencies
In this project folder (`SymptoVet`):
```powershell
npm install
npx expo install --fix
```
`--fix` aligns every package to versions that match the installed Expo SDK.
(If `npm install` errors on peer dependencies, run `npm install --legacy-peer-deps`, then `npx expo install --fix`.)

### 3. Put "Expo Go" on your Android phone
Install **Expo Go** from the Google Play Store. This lets you run the app by scanning a QR code — no Android Studio needed.

### 4. Start it
```powershell
npx expo start
```
A QR code appears in the terminal. Open **Expo Go** on your phone → **Scan QR code**. Make sure the phone and PC are on the **same Wi-Fi**. (If they can't connect, run `npx expo start --tunnel`.)

The app opens to the **consent screen** the first time, then the client list.

---

## Trying the features
1. Accept the consent screen.
2. Tap **Add client** → enter a name + phone → Save.
3. On the client page, tap **Add a pet** → take/choose a **photo**, enter species → Save. Add more pets to the same client.
4. Tap **Set next visit date & time** → pick a date, then a time. Allow notifications when asked.
5. Tap **🔔 Reminders** (top of the home screen) to see all reminders — they stay here even if you swipe the phone notification away.

---

## Notes & next steps
- **Data is stored locally on the device** for now (via AsyncStorage). This lets you use the app immediately. The data layer (`lib/store.ts`) is isolated so we can move to **Supabase** later for accounts, secure sync, and multi-device — as described in `BUILD_PROMPT.md`.
- **Notifications in Expo Go**: on some Android/Expo versions, scheduled notifications are limited inside Expo Go. The **in-app Reminders window always works** regardless. For rock-solid notifications we'll later make a "development build."
- **The consent text is a plain-language disclaimer, not legal advice.** Before launch, have a lawyer draft your real Terms of Service / disclaimer (see the note in chat).

## Project structure
```
app/
  _layout.tsx        Navigation + theme; registers notifications
  index.tsx          Home: client list (+ consent gate on first launch)
  consent.tsx        First-launch disclaimer + acceptance
  client/new.tsx     Add client (name, phone)
  client/[id].tsx    Client detail: pets (+photo) and next-visit scheduling
  reminders.tsx      In-app reminders window
components/ui.tsx     Shared Button / Field / Card
lib/
  types.ts           Client / Patient / Reminder shapes
  store.ts           Local data layer (swap for Supabase later)
  notifications.ts   Local notification scheduling
  theme.ts           Colors / spacing / radius tokens
```
