import { createClient, RedisClientType } from 'redis';
import { config } from './app.config';

export let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    if (!config.REDIS_ENABLED) {
      console.log('Redis disabled by config (REDIS_ENABLED=false).');
      return;
    }

    redisClient = createClient({
      socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
      password: config.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Redis connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to Redis:', error);
    throw error;
  }
}

export async function closeRedis(): Promise<void> {
  try {
    if (!config.REDIS_ENABLED) return;
    await redisClient.quit();
    console.log('Redis connection closed.');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    throw error;
  }
}

// 缓存工具函数
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    const data = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, data);
    } else {
      await redisClient.set(key, data);
    }
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Error deleting cache:', error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error deleting cache pattern:', error);
  }
}
