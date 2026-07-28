import Redis from "ioredis";

// ─── LIGHTWEIGHT IN-MEMORY FALLBACK CACHE ───
// If Redis URL is missing or unreachable, we fall back to this in-memory TTL map
// so local development works out-of-the-box and production server never crashes!
class InMemoryCache {
  constructor() {
    this.store = new Map();
    console.log("⚠️ Using InMemoryCache fallback for Redis operations.");
  }

  _isExpired(item) {
    return item.expireAt && Date.now() > item.expireAt;
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (this._isExpired(item)) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, duration, flag) {
    const now = Date.now();
    const existing = await this.get(key);

    if (flag === "NX" && existing !== null) {
      return null; // Key exists, NX means do not overwrite
    }

    let expireAt = null;
    if (mode === "EX" && duration) {
      expireAt = now + duration * 1000;
    } else if (mode === "PX" && duration) {
      expireAt = now + duration;
    }

    this.store.set(key, { value: String(value), expireAt });
    return "OK";
  }

  async del(key) {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key) {
    const current = await this.get(key);
    const num = current !== null ? parseInt(current, 10) || 0 : 0;
    const nextVal = num + 1;
    
    const item = this.store.get(key);
    const expireAt = item ? item.expireAt : null;
    
    this.store.set(key, { value: String(nextVal), expireAt });
    return nextVal;
  }

  async exists(key) {
    const val = await this.get(key);
    return val !== null ? 1 : 0;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expireAt) return -1;
    const remainingMs = item.expireAt - Date.now();
    if (remainingMs <= 0) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil(remainingMs / 1000);
  }
}

let redisClient = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;

  if (!redisUrl || redisUrl.includes("********") || redisUrl.includes("YOUR_PASSWORD")) {
    console.warn("⚠️ Valid REDIS_URL not found (missing or placeholder password detected). Falling back to in-memory cache.");
    redisClient = new InMemoryCache();
    return redisClient;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          console.error("❌ Redis reconnection attempts exceeded. Switching to in-memory fallback.");
          redisClient = new InMemoryCache();
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      tls: redisUrl.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    });

    client.on("connect", () => {
      console.log("✅ Successfully connected to Redis (EC2 Persistent Connection)");
    });

    client.on("error", (err) => {
      console.error("❌ Redis Client Error:", err.message);
      if (err.message.includes("WRONGPASS") || err.message.includes("NOAUTH") || err.message.includes("ECONNREFUSED")) {
        console.warn("⚠️ Fatal Redis error detected. Switching permanently to InMemoryCache fallback.");
        client.disconnect();
        redisClient = new InMemoryCache();
      }
    });

    redisClient = client;
  } catch (error) {
    console.error("❌ Failed to initialize Redis client:", error.message);
    redisClient = new InMemoryCache();
  }

  return redisClient;
};

export default getRedisClient;
