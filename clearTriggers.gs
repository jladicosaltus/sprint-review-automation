/**
 * Completely resets all triggers and stored properties related to Sprint Review automation.
 * This provides a clean slate to restart the automation process.
 * Updated to handle the new composite key format for recurring events.
 */
function completeReset() {
  // 1. Delete all existing triggers
  const allTriggers = ScriptApp.getProjectTriggers();
  let triggerCount = 0;

  allTriggers.forEach(trigger => {
	// Only delete triggers related to sprint reviews
	const handlerFunction = trigger.getHandlerFunction();
	if (handlerFunction === 'prepareSprintReviewSlides' ||
		handlerFunction === 'scheduleUpcomingSprintReviews') {
	  ScriptApp.deleteTrigger(trigger);
	  triggerCount++;
	  Logger.log(`Deleted trigger for function: ${handlerFunction}`);
	}
  });

  Logger.log(`Removed ${triggerCount} triggers from the project`);

  // 2. Clear all stored properties
  const properties = PropertiesService.getScriptProperties();
  const props = properties.getProperties();
  let propCount = 0;

  for (const key in props) {
	if (key.startsWith('TRIGGER_EVENT_')) {
	  properties.deleteProperty(key);
	  propCount++;
	  Logger.log(`Deleted property: ${key}`);
	}
  }

  Logger.log(`Removed ${propCount} stored event properties`);

  // 3. Log completion message
  Logger.log('------------------------------------');
  Logger.log('Complete reset finished successfully');
  Logger.log('The system is now ready for a fresh start');
  Logger.log('Run scheduleUpcomingSprintReviews() to set up new triggers');
}

/**
 * Lists all stored event properties without deleting them.
 * Updated to handle the new composite key format for recurring events.
 */
function listStoredEventProperties() {
  const properties = PropertiesService.getScriptProperties();
  const props = properties.getProperties();
  let count = 0;

  Logger.log('Currently stored event properties:');
  Logger.log('------------------------------------');

  for (const key in props) {
	if (key.startsWith('TRIGGER_EVENT_')) {
	  count++;
	  const eventId = props[key];
	  Logger.log(`${count}. Property: ${key}`);

	  // Extract date part from the composite key if present
	  let eventDate = "Unknown";
	  const keyParts = key.split('_');
	  if (keyParts.length >= 4) {
		// Format is TRIGGER_EVENT_[eventId]_[date]
		eventDate = keyParts[3];
		if (keyParts.length > 4) {
		  // Handle case where the event ID itself contains underscores
		  eventDate = keyParts.slice(3).join('_');
		}
	  }

	  Logger.log(`   Event ID: ${eventId}`);
	  Logger.log(`   Event Date: ${eventDate}`);

	  // Try to get event details if possible
	  try {
		const event = CalendarApp.getEventById(eventId);
		if (event) {
		  Logger.log(`   Title: ${event.getTitle()}`);
		  Logger.log(`   Actual Start Date: ${event.getStartTime().toDateString()}`);
		} else {
		  Logger.log(`   Event details not found (event may have been deleted)`);
		}
	  } catch (e) {
		Logger.log(`   Cannot access event details: ${e.message}`);
	  }

	  Logger.log('------------------------------------');
	}
  }

  if (count === 0) {
	Logger.log('No stored event properties found');
  } else {
	Logger.log(`Found ${count} stored event properties`);
  }
}

/**
 * Lists all active triggers in the project without deleting them.
 * Useful for seeing what triggers are actually scheduled.
 */
function listAllTriggers() {
  const allTriggers = ScriptApp.getProjectTriggers();
  let count = 0;

  Logger.log('Currently active triggers:');
  Logger.log('------------------------------------');

  allTriggers.forEach(trigger => {
	count++;
	Logger.log(`${count}. Function: ${trigger.getHandlerFunction()}`);
	Logger.log(`   Event Type: ${trigger.getEventType()}`);

	if (trigger.getEventType() === ScriptApp.EventType.CLOCK) {
	  if (trigger.getTriggerSourceId()) {
		Logger.log(`   Trigger ID: ${trigger.getUniqueId()}`);
		Logger.log(`   Source ID: ${trigger.getTriggerSourceId()}`);
	  }
	}

	Logger.log('------------------------------------');
  });

  if (count === 0) {
	Logger.log('No active triggers found');
  } else {
	Logger.log(`Found ${count} active triggers`);
  }
}