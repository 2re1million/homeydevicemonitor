/*
=== Homey Device Monitor Script ===

* This script is configured directly from your Homey Flow using the "Arguments" field.
* This makes it highly reusable for different monitoring needs without editing the code.
*
* Example Argument for critical sensors:
* { "MAX_TIME_SINCE_UPDATE": 8, "DEVICE_IDS_TO_SHOW": ["id-1", "id-2"] }
*
* Example Argument for all lights:
* { "MAX_TIME_SINCE_UPDATE": 72, "DEVICE_CLASSES_TO_SHOW": ["light"] }
*/

// --- DEFAULT CONFIGURATION ---
// These settings are used if no arguments are provided in the Flow.
const defaultConfig = {
  // Set to true to get a list of all devices and their IDs, useful for initial setup.
  SHOW_ALL_DEVICES: false,
  // Default classes to monitor. E.g., ['sensor', 'light']
  DEVICE_CLASSES_TO_SHOW: [],
  // Default IDs to monitor. E.g., ["id-1", "id-2"]
  DEVICE_IDS_TO_SHOW: [],
  // Default IDs to ignore.
  DEVICE_IDS_TO_IGNORE: [],
  // Default maximum time since last update (in hours).
  MAX_TIME_SINCE_UPDATE: 48,
};

// --- SCRIPT STARTS HERE ---

// Merge arguments from Flow with default config
const flowArgs = args[0] ? JSON.parse(args[0]) : {};
const CONFIG = { ...defaultConfig, ...flowArgs };


// Function to format the time since last update
function formatTimeSince(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

// Main function to monitor devices
async function runDeviceMonitor() {
  let fullOutput = "";
  let conciseOutput = "";
  let issueCount = 0;
  const devices = await Homey.devices.getDevices();

  if (CONFIG.SHOW_ALL_DEVICES) {
    let allDevicesList = '--- ALL DEVICES ---\n';
    for (const device of Object.values(devices)) {
      allDevicesList += `\nName: ${device.name}\nClass: ${device.class}\nID: ${device.id}\n`;
    }
    log(allDevicesList);
    return true; // Stop execution after listing all devices
  }

  for (const device of Object.values(devices)) {
    // Filter by class, if specified
    if (CONFIG.DEVICE_CLASSES_TO_SHOW.length > 0 && !CONFIG.DEVICE_CLASSES_TO_SHOW.includes(device.class)) {
      continue;
    }
    // Filter by specific IDs, if specified
    if (CONFIG.DEVICE_IDS_TO_SHOW.length > 0 && !CONFIG.DEVICE_IDS_TO_SHOW.includes(device.id)) {
      continue;
    }
    // Ignore specified IDs
    if (CONFIG.DEVICE_IDS_TO_IGNORE.includes(device.id)) {
      continue;
    }

    if (!device.capabilitiesObj || Object.keys(device.capabilitiesObj).length === 0) continue;

    const mostRecentUpdate = Object.values(device.capabilitiesObj).reduce((latest, cap) => {
      const capDate = new Date(cap.lastUpdated);
      return capDate > latest ? capDate : latest;
    }, new Date(0));

    const timeSinceUpdateHours = (new Date() - mostRecentUpdate) / 3600000;

    if (timeSinceUpdateHours >= CONFIG.MAX_TIME_SINCE_UPDATE) {
      issueCount++;
      const lastSeen = formatTimeSince(mostRecentUpdate);
      fullOutput += `\n=== ${device.name} ===\nClass: ${device.class}\nLast Seen: ${lastSeen}\nID: ${device.id}\n`;
      conciseOutput += `- ${device.name} (seen ${lastSeen})\n`;
    }
  }

  if (issueCount === 0) {
    // No issues found, clear tags and throw an error to stop the flow
    await tag('full_report', '');
    await tag('concise_report', '');
    await tag('issue_count', 0);
    throw new Error('No devices with issues found. Flow stopped.');
  }

  // Issues were found, set tags and log the output
  const summary = `Found ${issueCount} device(s) needing attention.`;
  await tag('full_report', `${summary}\n${fullOutput}`);
  await tag('concise_report', `${summary}\n${conciseOutput}`);
  await tag('issue_count', issueCount);

  log(fullOutput);
  log(summary);

  return true;
}

// Run the monitor
return await runDeviceMonitor();
