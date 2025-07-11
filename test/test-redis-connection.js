import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.REDIS_URL) {
  console.error('❌ REDIS_URL not set in .env');
  process.exit(1);
}

const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false
  }
});

redis.ping()
  .then((res) => {
    console.log('✅ Redis ping response:', res);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Redis connection error:', err);
    process.exit(1);
  }); 