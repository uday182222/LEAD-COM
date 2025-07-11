const { Queue } = require('bullmq');

const connection = {
  connection: {
    url: process.env.REDIS_URL
  }
};

const emailQueue = new Queue('emailQueue', connection);

module.exports = emailQueue; 