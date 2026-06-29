const axios = require('axios');

const WA_API   = 'https://graph.facebook.com/v21.0';
const PHONE_ID = () => process.env.WA_PHONE_NUMBER_ID;
const TOKEN    = () => process.env.WA_TOKEN;

/**
 * Send a plain-text WhatsApp message.
 * Falls back to console.log if credentials aren't set.
 */
async function sendWhatsApp(to, message) {
  if (!TOKEN() || !PHONE_ID()) {
    console.log(`📱 [MOCK WA → ${to}]: ${message}`);
    return { success: true, mock: true };
  }

  const num = to.startsWith('+') ? to.slice(1) : to;

  try {
    const res = await axios.post(
      `${WA_API}/${PHONE_ID()}/messages`,
      { messaging_product: 'whatsapp', to: num, type: 'text', text: { body: message } },
      { headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ WhatsApp sent to ${to}`);
    return { success: true, messageId: res.data?.messages?.[0]?.id };
  } catch (err) {
    console.error('❌ WhatsApp error:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

/* ── Message Templates ── */

const msg = {
  applicationReceived: (name, jobTitle) =>
    `Hi ${name}! 👋\n\nThank you for applying to the *${jobTitle}* position through ClearHire.\n\n✅ Your CV has been received and is being reviewed by our AI scoring system. You'll hear back shortly!`,

  shortlisted: (name, jobTitle) =>
    `Great news, ${name}! 🎉\n\nYou've been *shortlisted* for the *${jobTitle}* position!\n\nOur team will reach out soon to schedule your interview. Keep an eye on your messages!`,

  underReview: (name, jobTitle) =>
    `Hi ${name},\n\nYour application for *${jobTitle}* is currently *under review* by our hiring team.\n\nWe'll update you with a decision shortly. Thank you for your patience! 🙏`,

  interviewInvite: (name, jobTitle, date) =>
    `Hi ${name}! 📅\n\nYou've been invited to interview for *${jobTitle}*!\n\n🗓 Date: ${date}\n\nPlease confirm your availability by replying to this message. Good luck! 🍀`,

  rejected: (name, jobTitle) =>
    `Hi ${name},\n\nThank you for your interest in the *${jobTitle}* position.\n\nAfter careful review, we've decided to move forward with other candidates. We'll keep your profile on file for future opportunities.\n\nWishing you all the best! 💪`,

  selected: (name, jobTitle) =>
    `Congratulations, ${name}! 🎊🎉\n\nWe're thrilled to inform you that you've been *selected* for the *${jobTitle}* position!\n\nOur team will send you the offer details shortly. Welcome aboard! 🚀`,

  offerLetter: (name, jobTitle) =>
    `Hi ${name},\n\nYour offer letter for *${jobTitle}* is ready! 📄\n\nPlease check your email for the full details. If you have any questions, feel free to reply here.\n\nWelcome to the team! 🎉`
};

/**
 * Send a templated notification.
 * @param {string} type — one of the msg keys above
 * @param {string} to  — phone number with country code
 * @param {object} data — { name, jobTitle, date? }
 */
async function notify(type, to, data) {
  const fn = msg[type];
  if (!fn) { console.error(`Unknown template: ${type}`); return; }
  const text = fn(data.name, data.jobTitle, data.date);
  return sendWhatsApp(to, text);
}

module.exports = { sendWhatsApp, notify, templates: msg };
