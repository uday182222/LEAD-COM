require('dotenv').config();
const { sendHTMLEmail } = require('./email-service');

(async () => {
  const result = await sendHTMLEmail(
    'sid@motionfalcon.com',
    'Welcome to Lead-Com - HTML Email Test',
    'templates/welcome.html'
  );
  console.log(result);
})(); 