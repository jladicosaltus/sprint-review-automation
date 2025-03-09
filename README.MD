# Sprint Review Slide Deck Automation

This project automates the creation of Sprint Review slide decks for recurring meetings using Google Apps Script. It automatically creates a copy of a template slide deck, updates the content with the correct sprint information and date, and moves it to a designated folder.

## Features

- **Automated Slide Creation**: Creates slide decks 10 days before each Sprint Review meeting
- **Custom File Naming**: Names files following the pattern "Sprint Review - FY26-Q1-S3-MMM DD"
- **Slide Content Updates**: Automatically updates the first slide with correct sprint information and meeting date
- **Calendar Integration**: Scans your Google Calendar for upcoming Sprint Review meetings
- **Email Notifications**: Sends notifications when slides are created and when the scheduler runs
- **Recurring Meeting Support**: Handles recurring calendar events properly

## Setup Instructions

### Prerequisites

- A Google account
- A template slide deck in Google Slides
- Sprint Review meetings in Google Calendar (must have exact title "Sprint Review")

### Step 1: Create the Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Add the script files from this repository

### Step 2: Configure the Settings

In the `config.js` file, update the following:

```javascript
const CONFIG = {
  // Template slide deck ID
  templateId: 'YOUR_TEMPLATE_SLIDE_ID',

  // Target folder ID where copies will be stored
  targetFolderId: 'YOUR_TARGET_FOLDER_ID'
};
```

To find these IDs:
- For template ID: Open your template in Google Slides and look at the URL. The ID is the long string between `/d/` and `/edit`.
- For folder ID: Open your destination folder in Google Drive and look at the URL. The ID is the string after `/folders/`.

### Step 3: Set Up Automation

Run these functions once to set up the automation:

1. `completeReset()` - Clear any existing triggers (if needed)
2. `setupMonthlyScheduler()` - Create a monthly trigger to scan for upcoming meetings
3. `scheduleUpcomingSprintReviews()` - Scan for upcoming meetings and set up initial triggers

### Step 4: Verify Setup

1. Run `testFindSprintReviewEvents()` to check if your calendar events are being detected correctly
2. Check the script logs to see what events were found
3. You should receive an email notification after running `scheduleUpcomingSprintReviews()`

## How It Works

### Fiscal Year, Quarter, and Sprint Calculation

- Fiscal year starts on April 1
- Quarters:
  - Q1: April to June
  - Q2: July to September
  - Q3: October to December
  - Q4: January to March
- Sprints: 2-week periods starting at the beginning of each quarter

### Slide Deck Creation Process

1. The scheduler runs monthly to find upcoming Sprint Review meetings
2. For each meeting, it schedules a trigger to run 10 days before the meeting
3. When triggered, the script:
   - Makes a copy of the template slide deck
   - Renames it based on fiscal year, quarter, sprint, and date
   - Moves it to the target folder
   - Updates the first slide with sprint information and meeting date
   - Sends an email notification with a link to the new slide deck

### Slide Content Updates

The script updates two elements on the first slide:
1. Sprint information: Replaces "Sprint FYXX-QY-SZ" with the correct values
2. Date: Replaces "Date: MMM DD, YYYY" with the actual meeting date

## Maintenance

- The automation runs on Google's servers and will continue to work even when your computer is off
- You'll receive email notifications when actions are taken
- The monthly scheduler ensures that new meetings are detected as they're added to your calendar

## Troubleshooting

If slides aren't being created automatically:

1. Check if the calendar events have the exact title "Sprint Review"
2. Run `listStoredEventProperties()` to see which events have triggers set
3. Run `listAllTriggers()` to see all active triggers
4. Check `View > Logs` for error messages
5. If needed, run `completeReset()` to clear everything and start fresh

## Function Reference

- `createSprintReviewSlides(date)` - Creates a slide deck for a specific date
- `scheduleUpcomingSprintReviews()` - Scans calendar and sets up triggers
- `setupMonthlyScheduler()` - Creates monthly trigger for the scheduler
- `completeReset()` - Clears all triggers and stored properties
- `testFindSprintReviewEvents()` - Tests calendar event detection without creating triggers
- `listStoredEventProperties()` - Shows tracked events
- `listAllTriggers()` - Shows all active triggers

## License

This project is available under the MIT license.