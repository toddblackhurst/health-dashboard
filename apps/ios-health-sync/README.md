# Todd Health Sync

Minimal native iOS client for Apple Health daily summaries.

## Scope

This app is intentionally small for PR 2. It requests read-only HealthKit access, summarizes the selected day range on-device, and posts the `apple-health-daily` payload to the existing Netlify coach API.

It does not write HealthKit data, store permanent secrets in source code, replace Garmin/Oura/Rack hierarchy, or change the coach backend.

## Local Use

For first real-phone verification, follow `PHYSICAL_DEVICE_TESTING.md` and keep the result staged until the live API and Supabase rows are read back.

1. Open `ToddHealthSync.xcodeproj` in Xcode.
2. Configure a development team and keep the HealthKit capability enabled.
3. Run on Todd's iPhone. Real Apple Health data is only available on device.
4. Enter the coach API base URL and coach API secret.
5. Tap `Connect Apple Health`.
6. Pick the number of days to summarize. The default is 7.
7. Tap `Sync Now`.

The API secret is stored in the iOS Keychain. The app posts to:

```text
/api/coach/apple-health-daily
```

## Payload Notes

Daily summaries use `source_app = Apple Health` and `source_device = <device name>`. The app includes duplicate policy and provenance fields so these rows can complement, not overwrite, canonical Garmin, Oura, Rack/Motra, nutrition, recovery sleep, or strength-session data.
