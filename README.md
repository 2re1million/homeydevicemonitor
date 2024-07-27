I wanted to share a solution I’ve developed for monitoring devices/sensors connectivity in my smart home setup. The problem I faced was not knowing if a sensor was working and sending up-to-date information. I’m sure everyone has had the problem with devices showing “last update 5 months ago” without knowing it.

This advanced flow has a time-based trigger, a HomeyScript, and sends notifications to my phone. Based on the criticality of the sensors/devices being monitored, I adjust the runtime on the flow trigger and what devices to monitor.

I have seen other solutions to the same problem on this forum, but I have found them a bit complicated to implement. If anyone else is in the same situation as me, feel free to test this flow and give feedback/further develop it to make it better.

#######
How to use the flow

Step1, Create the script
While using your computer, log in to your Homey portal and press “Web app”. In the left-side banner, click “HomeyScript”. Then click “+ New HomeyScript” and paste in the code from this

GitHub repo:
https://github.com/2re1million/homeydevicemonitor/blob/main/homeyDeviceMonitor.js

Step 2, Configure the script to suit you needs

One way to use the script is to:
(best if you have a few devices you want to monitor closely)

Edit line 20 (const SHOW_ALL_DEVICES) from false to true

Run the script in the editor, and copy the ID name of each individual device you want to monitor.

Paste the ID into the DEVICE_IDS_TO_SHOW inside the square brackets. (Remember that each ID needs quotation marks before and after the name. Use a comma between each ID.)

Set line 20 back to false after.

Example: const DEVICE_IDS_TO_SHOW = [“34sdf4-3433-332432-3sdfd”, “dsfs3d-3433-332432-3sdfd”, “55yytf4-3433-332432-3sdfd”];

The other option:
(best if there are many devices you want to monitor)

Add the class(es) you want to monitor to the “DEVICE_CLASSES_TO_SHOW” in line 25. (All of your lights for example.)
Different classes: [‘sensor’, ‘light’, ‘other’, ‘speaker’, ‘thermostat’, ‘socket’, ‘tv’, ‘blinds’, ‘remote’]
If there are some devices you don’t want to monitor, just add their device ID to the “DEVICE_IDS_TO_IGNORE” square brackets.
(You get the ID by running the script once with “SHOW_ALL_DEVICES” set to true and running it once)
Then ADJUST the time you want to be notified by.

Editing line 30, const MAX_TIME_SINCE_UPDATE = 48;

Critical devices should have a short time, e.g., 8 hours.
Non-critical devices might be multiple days, 48 or more.

Very important
Sometimes the output of the code in the editor is Error. This is most likely because there are no faulty devices. The script outputs an error if there are no sensors found (to stop the notification from being sent to your phone. I don’t want a notification multiple times a day saying my devices work as intended) :upside_down_face:

Step 3, Create a new “Advanced Flow” and set it up like this

https://global.discourse-cdn.com/business4/uploads/athom/optimized/3X/a/4/a42e5fee4abebf54fa84c84b79e92d7fc7691e3f_2_690x322.png

It’s a time-based trigger card.
Then the code card is: HomeyScript with “Run Script”. Select your new code from the list of javascript files.

Then the notification card with you as a user.

I have also used the app “PaperTrails Log” to give some more information in the output, but this is not necessary at all.

Step 4)

Best practices should be to set up twice-a-day monitoring with few hours for critical devices…

For example, I have one flow, that checks, twice a day that the “water heater” and garage “dehumidifier” have been up and running for the last 8 hours.

Then I have a different flow with a weekly trigger to see if all devices with class sensors and lights have been running for the last 60 hours.
