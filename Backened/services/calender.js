// services/calendar.js
const { google } = require("googleapis");

// You need a Google OAuth2 client setup (credentials from Google Cloud Console)
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

/**
 * Schedule a mock interview on Google Calendar
 * @param {String} summary - Event title
 * @param {Date} startDate - Start datetime
 * @param {Date} endDate - End datetime
 * @param {String} email - Attendee email
 */
async function scheduleInterview(summary, startDate, endDate, email) {
  try {
    const event = {
      summary,
      start: { dateTime: startDate.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: endDate.toISOString(), timeZone: "Asia/Kolkata" },
      attendees: [{ email }],
    };
    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    return res.data;
  } catch (err) {
    console.error("Calendar Error:", err.message);
    throw err;
  }
}

module.exports = { scheduleInterview };
