# Local iMessage Bridge — Experimental

This is the planned local bridge for making the coach feel like iMessage.

## Reality check

Apple does not provide a normal public personal iMessage bot API. The practical personal-use path is a Mac-local bridge that uses Shortcuts or AppleScript to send a message from the signed-in Messages app.

Use this as an optional interface layer only. Supabase remains the source of truth.

## Proposed flow

1. Coach writes a message into `coach_messages` with `channel = 'imessage_pending'`.
2. A local Mac job polls Supabase for pending messages.
3. The job asks for action-time confirmation before the first send in a session.
4. The Mac sends the text through Messages.
5. Replies are captured manually at first, or through Shortcuts if reliable enough.

## Safety rule

Sending through Messages transmits content through Apple/iMessage. The bridge must never send health, medical, or other sensitive content without explicit confirmation for the destination and message scope.

## Minimal AppleScript shape

```applescript
on run argv
  set targetBuddy to item 1 of argv
  set messageText to item 2 of argv
  tell application "Messages"
    set targetService to 1st service whose service type = iMessage
    set targetBuddyObj to buddy targetBuddy of targetService
    send messageText to targetBuddyObj
  end tell
end run
```

Do not run this automatically until Todd chooses the recipient address/phone number and confirms the send behavior.
