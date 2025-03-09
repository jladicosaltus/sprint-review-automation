/**
 * Finds upcoming Sprint Review meetings and schedules slide creation 10 days before each one.
 * Run this function monthly to maintain the scheduling.
 */
function scheduleUpcomingSprintReviews() {
  // Configuration
  const calendarId = 'primary'; // Use your calendar ID or 'primary' for main calendar
  const exactSearchTerm = 'Sprint review'; // Exact text to match in event titles
  const daysInAdvance = 10; // Number of days before the event to create slides
  const lookaheadDays = 60; // How many days ahead to look for events

  // Calculate date range for searching events
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + lookaheadDays);

  // Get calendar and events - we'll get all events and filter for exact matches
  const calendar = CalendarApp.getCalendarById(calendarId);
  const allEvents = calendar.getEvents(now, futureDate);

  // Filter for events with exactly matching titles
  const events = allEvents.filter(event => event.getTitle().trim() === exactSearchTerm.trim());

  Logger.log(`Found ${events.length} upcoming Sprint Review events in the next ${lookaheadDays} days`);

  // Track how many triggers we've set
  let triggersCreated = 0;

  // Store dates for email notification
  let nextMeetingDate = null;
  const scheduledDates = [];

  // Process each event
  events.forEach(event => {
	const eventDate = event.getStartTime();
	const eventId = event.getId();
	const eventTitle = event.getTitle();

	// Track the closest upcoming meeting
	if (nextMeetingDate === null || eventDate < nextMeetingDate) {
	  nextMeetingDate = eventDate;
	}

	// Format date for display in email
	const formattedEventDate = Utilities.formatDate(eventDate, Session.getScriptTimeZone(), 'MMMM dd, yyyy');
	scheduledDates.push(formattedEventDate);

	// Calculate the target date (10 days before the event)
	const targetDate = new Date(eventDate);
	targetDate.setDate(targetDate.getDate() - daysInAdvance);

	// Only create triggers for events that are more than 10 days away
	// (So we don't try to schedule triggers in the past)
	if (targetDate > now) {
	  // Check if we already have a trigger for this specific event instance
	  // Pass both event ID and date to handle recurring events
	  const existingTrigger = checkExistingTrigger(eventId, eventDate);

	  if (!existingTrigger) {
		// Schedule the slide creation trigger
		// Pass the event date as well
		createTimedTrigger(targetDate, eventId, eventDate);
		triggersCreated++;

		Logger.log(`Scheduled slide creation for "${eventTitle}" on ${targetDate.toDateString()}`);
	  } else {
		Logger.log(`Trigger already exists for event "${eventTitle}" on ${eventDate.toDateString()}`);
	  }
	} else {
	  Logger.log(`Event "${eventTitle}" on ${eventDate.toDateString()} is too soon (less than ${daysInAdvance} days away)`);
	}
  });

  Logger.log(`Created ${triggersCreated} new triggers for upcoming meetings`);

  // Send notification email with the results
  sendSchedulerNotificationEmail(nextMeetingDate, scheduledDates, triggersCreated);
}

/**
 * Create a time-based trigger for a specific date
 * Modified to handle recurring events by including the event date in the key
 */
function createTimedTrigger(triggerDate, eventId, eventDate) {
  // Create a unique function name for this event
  const functionName = 'prepareSprintReviewSlides';

  // Create a composite key that includes the event date
  const dateString = Utilities.formatDate(eventDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const compositeKey = `TRIGGER_EVENT_${eventId}_${dateString}`;

  // Store the event ID and date in PropertiesService so we can retrieve it later
  PropertiesService.getScriptProperties().setProperty(compositeKey, eventId);

  // Create the trigger
  ScriptApp.newTrigger(functionName)
	.timeBased()
	.at(triggerDate)
	.create();
}

/**
 * Check if a trigger already exists for this event instance
 * Modified to handle recurring events by including the event date in the key
 */
function checkExistingTrigger(eventId, eventDate) {
  // Create a key that includes both the event ID and the date
  // This allows different instances of recurring events to have separate triggers
  const dateString = Utilities.formatDate(eventDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const compositeKey = `TRIGGER_EVENT_${eventId}_${dateString}`;

  // Get all properties
  const props = PropertiesService.getScriptProperties().getProperties();

  // Check if this specific event instance exists in properties
  return props[compositeKey] !== undefined;
}

/**
 * This function is called by the timed trigger
 * It creates the slide deck for the upcoming meeting
 */
function prepareSprintReviewSlides() {
  // Get all triggers that might have invoked this function
  const triggers = ScriptApp.getProjectTriggers();

  // Find which trigger fired (the one closest to now)
  let closestTrigger = null;
  let smallestDiff = Infinity;

  const now = new Date();

  triggers.forEach(trigger => {
	if (trigger.getHandlerFunction() === 'prepareSprintReviewSlides') {
	  // Get trigger time
	  const triggerTime = trigger.getTriggerSourceId();
	  if (triggerTime) {
		const triggerDate = new Date(triggerTime);
		const timeDiff = Math.abs(now - triggerDate);

		if (timeDiff < smallestDiff) {
		  smallestDiff = timeDiff;
		  closestTrigger = trigger;
		}
	  }
	}
  });

  // Clean up by deleting the trigger that fired
  if (closestTrigger) {
	ScriptApp.deleteTrigger(closestTrigger);
  }

  // Now create the slide deck using today's date plus 10 days (since this should be 10 days before the event)
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + 10); // Add 10 days to get the event date

  // Create the slide deck
  const slideUrl = createSprintReviewSlides(targetDate);

  Logger.log(`Created slide deck for upcoming Sprint Review: ${slideUrl}`);

  // Send an email notification
  sendNotificationEmail(slideUrl, targetDate);

  // After creating for one meeting, check for future meetings and update triggers
  scheduleUpcomingSprintReviews();
}

/**
 * Sends an email notification with the slide deck URL
 * after slides are prepared
 */
function sendNotificationEmail(slideUrl, meetingDate) {
  const recipient = Session.getActiveUser().getEmail();
  const subject = 'Sprint review automation notification';

  const formattedDate = Utilities.formatDate(meetingDate, Session.getScriptTimeZone(), 'MMMM dd, yyyy');

  const body = `Sprint review automation successfully completed.

The slide deck for your upcoming Sprint Review on ${formattedDate} has been created.

You can access the slides here: ${slideUrl}
  `;

  GmailApp.sendEmail(recipient, subject, body);
}

/**
 * Sends a notification email about scheduled triggers
 */
function sendSchedulerNotificationEmail(nextMeetingDate, scheduledDates, triggersCreated) {
  const recipient = Session.getActiveUser().getEmail();
  const subject = 'Sprint review automation notification';

  let nextMeetingText = 'No upcoming sprint reviews found.';
  if (nextMeetingDate) {
	const formattedNextDate = Utilities.formatDate(nextMeetingDate, Session.getScriptTimeZone(), 'MMMM dd, yyyy');
	nextMeetingText = `The next sprint review will be on ${formattedNextDate}.`;
  }

  let triggersList = 'No triggers have been set.';
  if (scheduledDates.length > 0) {
	triggersList = 'Triggers for the following sprint reviews have been set:\n';
	scheduledDates.forEach(date => {
	  triggersList += `* ${date}\n`;
	});
  }

  const body = `Sprint review automation successfully completed.

${nextMeetingText}

${triggersList}

${triggersCreated} new trigger(s) were created during this run.
`;

  GmailApp.sendEmail(recipient, subject, body);
  Logger.log('Notification email sent');
}

/**
 * Creates a recurring trigger to run the scheduler monthly
 * This ensures we keep checking for new events
 */
function setupMonthlyScheduler() {
  // Clear any existing scheduler triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
	if (trigger.getHandlerFunction() === 'scheduleUpcomingSprintReviews') {
	  ScriptApp.deleteTrigger(trigger);
	}
  });

  // Create a new monthly trigger
  ScriptApp.newTrigger('scheduleUpcomingSprintReviews')
	.timeBased()
	.onMonthDay(1) // Run on the 1st of each month
	.atHour(9)     // Run at 9 AM
	.create();

  Logger.log('Monthly scheduler has been set up');
}