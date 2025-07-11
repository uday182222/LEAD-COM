require('dotenv').config();
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

redis.ping()
  .then(res => {
    console.log('Redis ping response:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('Redis connection error:', err);
    process.exit(1);
  }); 