# iPhone Shortcut Setup

Use this to send phone data directly into the connected coach.

## Shortcut action research

The shared iCloud Shortcut URL was unavailable when checked. The Reddit thread on hidden actions points to Apple's internal `WFActions.plist` as the source for hidden/built-in Shortcuts actions and warns that some hidden actions can be disruptive. For Todd's coach, use stable native actions only:

- `Ask for Input`
- `Choose from Menu`
- `Dictionary`
- `Get Contents of URL`
- `Format Date`
- `Show Result`
- `Open URLs`
- `Save File`
- `Get File from Folder`
- `Get Latest Photos`
- `Share`
- `Run Shortcut`
- `Show Notification`

Do not rely on hidden actions for the core coaching workflow. The coach should be boringly reliable from the iPhone.

## Screenshot inbox watcher

The Mac now watches this screenshot folder:

```text
/Users/toddsdesktop/Library/Mobile Documents/com~apple~CloudDocs/Coach Screenshots
```

This is the only valid screenshot destination. Do not use the project folder under `Desktop/...` or the duplicate `Desktop/CoworkProjects/...` copy. LaunchAgents cannot reliably read Desktop folders without extra macOS privacy permissions, so the live watcher uses the iCloud Drive folder instead.

Use your screenshot-upload Shortcut to save screenshots there. The Mac watcher checks the folder every minute, copies new image files into `~/.todd-coach/screenshots/inbox/`, reads the image with OpenAI vision when `OPENAI_API_KEY` is configured, categorizes the screenshot, extracts visible metrics, and logs structured coach intake rows through the live API.

Supported files:

- `.jpg`
- `.jpeg`
- `.png`
- `.heic`
- `.heif`
- `.webp`

Important constraint: the watcher only extracts what is visible in the screenshot. If the screenshot is cropped, covered by a notification, blurred, or missing the date, the stored data will be limited to what can be seen.

After a screenshot is processed, the original is moved into a dated `processed/` subfolder inside the iCloud Drive inbox.

## Installed shortcuts

- `Coach Message`: installed and ready now. Use this from iPhone to send any note to coach.
- `Coach Intake`: installed as the future structured intake version, but it needs the newer Netlify function deploy before use.

## Recommended coach shortcuts

All coach shortcuts use:

```text
Method: POST
Header: x-coach-secret: your COACH_API_SECRET value
Header: Content-Type: application/json
Request Body: JSON
```

### Morning Check-In

Endpoint:

```text
https://todd-personal-coach.netlify.app/api/coach/brief
```

Dictionary:

```json
{
  "text": "Morning check-in from iPhone",
  "channel": "iphone-shortcut"
}
```

Show `reply` from the returned JSON. This should be a one-tap shortcut.

### Build Today's Workout

Endpoint:

```text
https://todd-personal-coach.netlify.app/api/coach/workout
```

Ask for optional input:

```text
Anything the coach should know before building?
```

Dictionary:

```json
{
  "text": "Build today's workout. Optional note: [Shortcut Input]",
  "channel": "iphone-shortcut"
}
```

If travel mode is active, the coach will ask for hotel-gym inventory before programming and will stop using World Gym floor routing.

### Nutrition Closeout

Endpoint:

```text
https://todd-personal-coach.netlify.app/api/coach/nutrition-closeout
```

Dictionary:

```json
{
  "text": "Nutrition closeout from Bevel",
  "channel": "iphone-shortcut"
}
```

This evaluates the latest Bevel totals. If the latest Bevel screenshot has not processed yet, use `Coach Intake` food logging or drop the screenshot into the iCloud watcher folder first.

### Post-Workout Debrief

Endpoint:

```text
https://todd-personal-coach.netlify.app/api/coach/post-workout
```

Ask for:

- Completed minutes
- Best movement
- Worst movement
- Pain notes
- Difficulty/RPE

Dictionary:

```json
{
  "text": "Post-workout debrief",
  "channel": "iphone-shortcut",
  "completed_minutes": "[Minutes]",
  "best_movement": "[Best]",
  "worst_movement": "[Worst]",
  "pain_notes": "[Pain]",
  "difficulty": "[Difficulty]"
}
```

### Fast Coach Note

Endpoint:

```text
https://todd-personal-coach.netlify.app/api/coach/message
```

Ask for:

```text
Coach note
```

Dictionary:

```json
{
  "text": "[Coach note]",
  "intent": "general",
  "channel": "iphone-shortcut"
}
```

## Use now: Coach Message

`Coach Message` sends a JSON payload to the live coach message endpoint:

```text
https://todd-personal-coach.netlify.app/api/coach?action=message
```

It includes this header:

```text
x-coach-secret: your COACH_API_SECRET value
```

Payload shape:

```json
{
  "text": "Your note from the iPhone prompt",
  "intent": "general",
  "channel": "iphone-shortcut"
}
```

Use it for:

- workout feedback
- BP notes
- food notes from Bevel
- recovery/travel updates
- anything coach should remember

## Later: structured Coach Intake

Once the `action=intake` Netlify function is live, `Coach Intake` can send typed payloads for BP, food, body, workout, and notes:

```text
https://todd-personal-coach.netlify.app/api/coach?action=intake
```

## Manual structured build reference

Open **Shortcuts** on iPhone and create a new shortcut.

### 1. Choose intake type

Add action: **Choose from Menu**

Menu items:

- `BP`
- `Food`
- `Body`
- `Workout`
- `Note`

### 2. BP menu branch

Add these actions:

1. **Ask for Input**: `Systolic`
   - Input type: Number
2. **Ask for Input**: `Diastolic`
   - Input type: Number
3. **Ask for Input**: `Heart rate`
   - Input type: Number
4. **Ask for Input**: `BP notes`
   - Input type: Text
5. **Dictionary**
   - `type`: `bp`
   - `date`: Current Date formatted as `yyyy-MM-dd`
   - `slot`: `Morning` or `Evening`
   - `systolic`: Systolic input
   - `diastolic`: Diastolic input
   - `heart_rate`: Heart rate input
   - `notes`: BP notes input
   - `summary`: `BP reading from Shortcut`

### 3. Food menu branch

Use Bevel as source of truth.

Ask for:

- Calories
- Protein grams
- Carbs grams
- Fat grams
- Notes

Dictionary:

- `type`: `food`
- `date`: Current Date formatted as `yyyy-MM-dd`
- `calories`: Calories input
- `protein`: Protein input
- `carbs`: Carbs input
- `fat`: Fat input
- `notes`: Notes input
- `summary`: `Bevel food log from Shortcut`

### 4. Body menu branch

Ask for:

- Weight lb
- Body fat %
- Lean mass lb
- Visceral fat level
- Notes

Dictionary:

- `type`: `body`
- `date`: Current Date formatted as `yyyy-MM-dd`
- `weight_lbs`: Weight input
- `body_fat_pct`: Body fat input
- `lean_mass_lbs`: Lean mass input
- `visceral_fat_level`: Visceral fat input
- `notes`: Notes input
- `summary`: `Bevel body log from Shortcut`

### 5. Workout menu branch

Ask for:

- Rating
- Completed minutes
- Best movement
- Worst movement
- Pain notes
- Full notes

Dictionary:

- `type`: `workout`
- `date`: Current Date formatted as `yyyy-MM-dd`
- `rating_label`: Rating input
- `completed_minutes`: Minutes input
- `best_movement`: Best movement input
- `worst_movement`: Worst movement input
- `pain_notes`: Pain notes input
- `notes`: Full notes input
- `summary`: `Workout feedback from Shortcut`

### 6. Note menu branch

Ask for:

- Coach note

Dictionary:

- `type`: `note`
- `date`: Current Date formatted as `yyyy-MM-dd`
- `notes`: Coach note input
- `summary`: Coach note input

### 7. Send to coach

After each menu branch, add:

Action: **Get Contents of URL**

Settings:

- URL: `https://todd-personal-coach.netlify.app/api/coach?action=intake`
- Method: `POST`
- Request Body: `JSON`
- JSON: the Dictionary from the selected branch
- Headers:
  - `Content-Type`: `application/json`
  - `x-coach-secret`: your `COACH_API_SECRET`

Then add:

Action: **Show Result**

Show:

```text
Sent to coach.
```

## Suggested Home Screen Buttons

After the first shortcut works, duplicate it into faster single-purpose shortcuts:

- `Log BP`
- `Log Food`
- `Workout Feedback`
- `Coach Note`

Those can skip the menu and go directly to the prompts.
