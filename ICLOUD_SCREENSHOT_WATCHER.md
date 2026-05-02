# iCloud Screenshot Watcher

This watcher lets an iPhone Shortcut save screenshots to iCloud Drive and have the Mac read them with OpenAI vision, categorize them, interpret the visible data, and log structured rows into the live coach API.

## Folder To Use

Save screenshots here from Shortcuts:

```text
iCloud Drive/Coach Screenshots
```

On the Mac, that folder is:

```text
/Users/toddsdesktop/Library/Mobile Documents/com~apple~CloudDocs/Coach Screenshots
```

## What It Does

Every minute, launchd runs:

```text
/Users/toddsdesktop/.todd-coach/bin/watch_icloud_screenshots.py
```

For each new image, it:

- waits until the file is at least 15 seconds old
- computes a SHA-256 hash so duplicates are skipped
- copies the image to `~/.todd-coach/screenshots/inbox/`
- converts HEIC/HEIF to JPEG before vision parsing
- sends the image to OpenAI vision
- identifies the source app and category
- extracts visible metrics without inventing hidden data
- posts structured intake rows to the coach API
- posts an audit note with the interpretation and local file path
- stores processed state in `~/.todd-coach/logs/icloud_screenshot_watcher_state.json`

Structured categories currently supported:

- blood pressure
- nutrition and meals
- body composition
- recovery and sleep
- activity sessions
- strength sessions
- workout feedback
- doctor or hospital notes
- general notes

## Logs

Runtime log:

```text
/Users/toddsdesktop/.todd-coach/logs/icloud_screenshot_watcher.log
```

launchd stderr/stdout:

```text
/Users/toddsdesktop/.todd-coach/logs/icloud-screenshot-watcher.err.log
/Users/toddsdesktop/.todd-coach/logs/icloud-screenshot-watcher.out.log
```

## Manage The Watcher

Status:

```bash
launchctl print gui/$(id -u)/com.toddblackhurst.coach-icloud-screenshot-watcher
```

Restart:

```bash
launchctl kickstart -k gui/$(id -u)/com.toddblackhurst.coach-icloud-screenshot-watcher
```

Stop:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.toddblackhurst.coach-icloud-screenshot-watcher.plist
```

Start:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.toddblackhurst.coach-icloud-screenshot-watcher.plist
```

## OpenAI Key

Vision parsing requires `OPENAI_API_KEY` in:

```text
/Users/toddsdesktop/.todd-coach/.env.local
```

The editable project copy is:

```text
/Users/toddsdesktop/Desktop/Codex Projects/Todd's Personal Coach/Todd's Personal Coach/.env.local
```

If no OpenAI key is present, the watcher falls back to logging the screenshot as a preserved manual-review note instead of losing the file.

## Current Limitation

The parser only extracts what is visible in the screenshot. It does not connect directly to Bevel, Oura, Apple Health, Motra, Hume, or Ocare APIs yet.
