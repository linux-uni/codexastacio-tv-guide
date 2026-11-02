# TV Listing App for Android

This lightweight Android wrapper opens the official TV Listing PWA at:
`https://linux-uni.github.io/codexastacio-tv-guide/`

The app keeps the website's login and schedule live, stores its session in the
WebView, and opens links outside the app in the browser. It does not bundle or
redistribute sports streams.

The GitHub Actions workflow builds an installable, debug-signed APK and saves it
as the `tv-listing-android-apk` workflow artifact.

- Application ID: `com.codexastacio.tvlisting`
- Minimum Android version: Android 6.0 (API 23)
- Build command: `gradle --no-daemon assembleDebug` from this directory
