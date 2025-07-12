import dotenv from 'dotenv';
dotenv.config();
import { sendHTMLEmail } from './email-service.js';

(async () => {
  const result = await sendHTMLEmail(
    'sid@motionfalcon.com',
    'Welcome to Lead-Com - HTML Email Test',
    'templates/welcome.html'
  );
  console.log(result);
})(); 