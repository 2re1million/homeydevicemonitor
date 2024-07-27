/*
=== Homey Device Monitor Script ===
 
 * USER CONFIGURATION:
 * Customize the settings below to match your needs.
 
* This is a script to monitor different unique devices or group of devices.
* Set the "SHOW_ALL_DEVICES" to true, first time to get a compleate list.
* Note down the devices you want to monitor and add it to the "DEVICE_IDS_TO_SHOW".
* If you want to monitor whole group of devices 
* (example all lights, use the "DEVICE_CLASSES_TO_SHOW" and insert 'light' into the []
* If there are certain devices you want to exclude from a group, add their ID into the "DEVICE_IDS_TO_IGNORE".
* After setting it up, remember to set the "SHOW_ALL_DEVICES" to false.

 Use advance flow to run the script with conditions.
*/

// Show all devices or filter by class
// Set to true to show all devices, or false to filter by specific classes (SET IT TO TRUE FRIST TIME - GET THE ID NUMBER AND NOTE DOWN DEVICES YOU WANT TO MONITOR)
const SHOW_ALL_DEVICES = false;

// Specify the device classes you want to monitor
// Leave the array empty [] to show all classes, or add specific classes like:
// ['sensor','light', 'other', 'speaker', 'thermostat', 'socket', 'tv', 'blinds', 'remote']  ALWAYS rember to use "" or '' before each class
const DEVICE_CLASSES_TO_SHOW = [];

// Maximum time since last update to show (in hours)
// Devices that haven't updated any capability for longer than this will be shown
// Example: Set to 8 to show devices not updated in the last 8 hours
const MAX_TIME_SINCE_UPDATE = 8;

// Device ID Filtering
// To monitor specific devices, add their IDs to the array below
// Example: "34349ff39-4445-47c0-9826-9edfd431e4", "5123459-6662-471c-9847-90e3df38af60", "5e43341-334f-40e8-9bd3-c1dfd64f343a0"
// Leave the array empty [] to include all devices. ALWAYS rember to use "" or '' before each ID
const DEVICE_IDS_TO_SHOW = [];

// To ignore specific devices, add their IDs to the array below
// Leave the array empty [] to include all devices. ALWAYS rember to use "" or '' before each ID
const DEVICE_IDS_TO_IGNORE = [];

/*
 * SCRIPT STARTS HERE
 */

// Function to format the time since last update
// This function takes a date and returns a human-readable string
function formatTimeSince(date) {
  if (!date) return 'Never';
  const now = new Date();
  const lastUpdated = new Date(date);

  // Adjust for time zone (example: CET, UTC+2)
  now.setHours(now.getHours() + 2);
  lastUpdated.setHours(lastUpdated.getHours() + 2);

  const diffMs = now - lastUpdated;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Main function to monitor devices
async function runDeviceMonitor() {
  let fullOutput = "";
  let conciseOutput = "";
  let deviceCount = 0;
  let issueCount = 0;
  const devices = await Homey.devices.getDevices();

  for (const [deviceId, device] of Object.entries(devices)) {
    if (!device.capabilitiesObj) continue; // Skip if device has no capabilities

    // Check if the device class is included (if SHOW_ALL_DEVICES is false)
    if (!SHOW_ALL_DEVICES && DEVICE_CLASSES_TO_SHOW.length > 0 && !DEVICE_CLASSES_TO_SHOW.includes(device.class)) {
      continue;
    }

    // Check if the device ID is included or ignored
    if (DEVICE_IDS_TO_SHOW.length > 0 && !DEVICE_IDS_TO_SHOW.includes(deviceId)) continue;
    if (DEVICE_IDS_TO_IGNORE.includes(deviceId)) continue;

    if (Object.keys(device.capabilitiesObj).length > 0) {
      let mostRecentUpdate = null;
      for (const capability of Object.values(device.capabilitiesObj)) {
        const lastUpdated = new Date(capability.lastUpdated);
        if (!mostRecentUpdate || lastUpdated > mostRecentUpdate) {
          mostRecentUpdate = lastUpdated;
        }
      }
      const timeSinceUpdateHours = mostRecentUpdate ? (new Date() - mostRecentUpdate) / 3600000 : Infinity;

      if (timeSinceUpdateHours >= MAX_TIME_SINCE_UPDATE || MAX_TIME_SINCE_UPDATE === 0) {
        deviceCount++;
        issueCount++;
        const lastSeen = formatTimeSince(mostRecentUpdate);

        // Detailed output
        fullOutput += `\n=== ${device.name} ===\n`;
        fullOutput += `Device Class: ${device.class || 'Not specified'}\n`;
        fullOutput += `Device ID: ${deviceId}\n`;
        for (const capability of Object.values(device.capabilitiesObj)) {
          const lastUpdated = formatTimeSince(capability.lastUpdated);
          fullOutput += `${capability.title}: ${capability.value} (Last updated: ${lastUpdated})\n`;
        }

        // Concise output for notifications
        conciseOutput += `=== ${device.name} ===\n`;
        conciseOutput += `Last Seen: ${lastSeen}\n\n`;
      }
    }
  }

  if (issueCount === 0) {
    // No issues found, clear the tags
    await tag('full_report', '');
    await tag('concise_report', '');
    await tag('device_count', 0);
    await tag('issue_count', 0);

    // Force an error to stop the flow
    throw new Error('No devices with issues found.');
  }

  // If there are issues, set the tags and log the output
  fullOutput += `\nDevice listing complete. ${issueCount} devices with issues found.`;
  conciseOutput += `\nTotal devices with issues: ${issueCount}`;

  await tag('full_report', fullOutput);
  await tag('concise_report', conciseOutput);
  await tag('device_count', deviceCount);
  await tag('issue_count', issueCount);

  // Log the output for debugging purposes
  log(fullOutput);
  log(`Total Devices Checked: ${deviceCount}`);
  log(`Devices with Issues: ${issueCount}`);

  return true; // Indicate that the script finished
}

// Run the monitor
return await runDeviceMonitor();
