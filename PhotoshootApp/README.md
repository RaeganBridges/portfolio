# Photoshoot App – Save to Camera Roll

Small React Native app that saves images to the device camera roll using `@react-native-camera-roll/camera-roll`.

## Prerequisites

- **Node.js** (v18+)
- **React Native environment** (Xcode for iOS, Android Studio for Android)
- **iOS:** CocoaPods (`sudo gem install cocoapods`)
- **Android:** JDK 17 and Android SDK

## Setup

### 1. Create the React Native project

From your portfolio folder (parent of `PhotoshootApp`), run:

```bash
npx @react-native-community/cli@latest init PhotoshootApp --directory PhotoshootApp
```

If that would overwrite this folder, create the app with a temp name then replace:

```bash
cd "/Users/raeganbridges/Documents/Local Software/GitHub/portfolio"
npx @react-native-community/cli@latest init PhotoshootAppNew
# then move contents from PhotoshootAppNew into PhotoshootApp and delete PhotoshootAppNew
```

### 2. Install Camera Roll

```bash
cd PhotoshootApp
npm install @react-native-camera-roll/camera-roll
```

### 3. iOS: install pods

```bash
cd ios && pod install && cd ..
```

### 4. Use this app code

Copy the contents of `App.js` from this folder into the generated project’s `App.js` (it’s already the correct `App.js` if you created the project inside `PhotoshootApp`).

If you created the project elsewhere, copy:

- `App.js` → your project’s `App.js`

### 5. iOS: add photo library usage (required)

Open `ios/PhotoshootApp/Info.plist` and add:

```xml
<key>NSPhotoLibraryAddUsageDescription</key>
<string>This app saves photos to your camera roll.</string>
```

(If the project name differs, replace `PhotoshootApp` with that name.)

### 6. Android: add permission

In `android/app/src/main/AndroidManifest.xml`, add:

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

(React Native 0.73+ may use a different storage permission; follow the [camera-roll docs](https://github.com/react-native-cameraroll/react-native-cameraroll) if needed.)

## Run

```bash
npm start
```

Then in another terminal:

- **iOS:** `npm run ios`
- **Android:** `npm run android`

## Usage

1. Enter a direct image URL (e.g. from your portfolio site).
2. Tap **Save**.
3. Grant photo library access when prompted.
4. The image is saved to the device camera roll.

## Note

`CameraRoll.save()` works with:

- A **local file URI** (e.g. from the device or a local path).
- A **remote URL** on some setups; if saving a URL fails, download the image to a temp file first and pass that file URI to `CameraRoll.save()`.
