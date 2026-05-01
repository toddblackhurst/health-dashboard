# iPhone Shortcut Setup

Use this to send phone data directly into the connected coach.

## Shortcut name

`Coach Intake`

## What it sends

The shortcut sends a JSON payload to:

```text
https://todd-personal-coach.netlify.app/api/coach?action=intake
```

It must include this header:

```text
x-coach-secret: your COACH_API_SECRET value
```

## Build the Shortcut

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
