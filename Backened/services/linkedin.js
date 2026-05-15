// services/linkedin.js
const axios = require("axios");

/**
 * Fetch LinkedIn profile data using OAuth token
 * @param {String} accessToken - User's LinkedIn OAuth token
 */
async function fetchLinkedInProfile(accessToken) {
  try {
    const profileRes = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const emailRes = await axios.get(
      "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return {
      firstName: profileRes.data.localizedFirstName,
      lastName: profileRes.data.localizedLastName,
      headline: profileRes.data.headline,
      email: emailRes.data.elements[0]["handle~"].emailAddress,
    };
  } catch (err) {
    console.error("LinkedIn Error:", err.message);
    throw err;
  }
}

module.exports = { fetchLinkedInProfile };
