import { MongoClient, type Db, type MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Updated options with better SSL/TLS handling
const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // Enhanced SSL/TLS options for better compatibility
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,

  // Additional SSL options for Atlas compatibility
  ssl: true,

  // Retry options
  retryWrites: true,
  retryReads: true,

  // Connection pool options
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 10000,

  // Additional Atlas-specific options
  authSource: 'admin',
  authMechanism: 'SCRAM-SHA-1',

  // Compressor options (can help with connection issues)
  compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function getDatabase(): Promise<Db> {
  try {
    console.log('Connecting to MongoDB with enhanced SSL configuration...');
    console.log('Connection URI (masked):', uri.replace(/\/\/.*@/, '//***:***@'));

    const client = await clientPromise;
    console.log('MongoDB connected successfully');

    // Test the connection with admin command
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB ping successful');

    const db = client.db('ReviewSync');
    console.log("Database 'ReviewSync' selected");

    // Test collection access
    const collections = await db.listCollections().toArray();
    console.log(
      'Available collections:',
      collections.map((c) => c.name),
    );

    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);

    // Provide more specific error information
    if (error instanceof Error) {
      if (
        error.message.includes('SSL') ||
        error.message.includes('TLS') ||
        error.message.includes('ssl3_read_bytes')
      ) {
        console.error('SSL/TLS Error detected. Trying alternative connection methods...');
        return await tryAlternativeConnection();
      }
      if (error.message.includes('ENOTFOUND')) {
        console.error('DNS resolution failed. Check your internet connection.');
      }
      if (error.message.includes('authentication')) {
        console.error('Authentication failed. Check your username and password.');
      }
    }

    throw error;
  }
}

// Alternative connection method for SSL issues
async function tryAlternativeConnection(): Promise<Db> {
  const alternativeOptions: MongoClientOptions[] = [
    // Option 1: Minimal SSL settings
    {
      ...options,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      ssl: undefined,
    },
    // Option 2: No explicit SSL settings
    {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
    },
    // Option 3: Different TLS version
    {
      ...options,
      tlsInsecure: true,
    },
  ];

  for (let i = 0; i < alternativeOptions.length; i++) {
    try {
      console.log(`Trying alternative connection method ${i + 1}...`);
      const altClient = new MongoClient(uri, alternativeOptions[i]);
      await altClient.connect();
      await altClient.db('admin').command({ ping: 1 });

      console.log(`Alternative connection method ${i + 1} successful!`);
      const db = altClient.db('ReviewSync');
      return db;
    } catch (altError) {
      console.error(
        `Alternative method ${i + 1} failed:`,
        altError instanceof Error ? altError.message : altError,
      );
      if (i === alternativeOptions.length - 1) {
        throw new Error(
          `All connection methods failed. Last error: ${
            altError instanceof Error ? altError.message : 'Unknown error'
          }`,
        );
      }
    }
  }

  throw new Error('All alternative connection methods failed');
}

// Enhanced test connection function
export async function testConnection() {
  const attempts = [
    {
      name: 'Standard Atlas Connection',
      uri: process.env.MONGODB_URI,
      options: options,
    },
    {
      name: 'Relaxed SSL Connection',
      uri: process.env.MONGODB_URI,
      options: {
        ...options,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      } as MongoClientOptions,
    },
    {
      name: 'Minimal Options Connection',
      uri: process.env.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        retryWrites: true,
        compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
      } as MongoClientOptions,
    },
    {
      name: 'Alternative URI Format',
      uri: process.env.MONGODB_URI?.replace(
        'retryWrites=true',
        'ssl=true&authSource=admin&retryWrites=true',
      ),
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
      } as MongoClientOptions,
    },
  ];

  for (const attempt of attempts) {
    try {
      console.log(`Testing ${attempt.name}...`);

      if (!attempt.uri) {
        throw new Error('MongoDB URI not found');
      }

      const client = new MongoClient(attempt.uri, attempt.options);
      await client.connect();

      // Test ping
      await client.db('admin').command({ ping: 1 });

      // Test database access
      const db = client.db('ReviewSync');
      const collections = await db.listCollections().toArray();

      const reviewsCollection = db.collection('reviews');
      const count = await reviewsCollection.countDocuments();

      // Test a simple query
      const sampleReview = await reviewsCollection.findOne();

      await client.close();

      return {
        success: true,
        method: attempt.name,
        collections: collections.map((c) => c.name),
        reviewCount: count,
        sampleReview: sampleReview
          ? {
              _id: sampleReview._id,
              reviewId: sampleReview.reviewId,
              starRating: sampleReview.starRating,
              hasReply: !!sampleReview.reviewReply,
            }
          : null,
        message: `Successfully connected using ${attempt.name}`,
      };
    } catch (error) {
      console.error(`${attempt.name} failed:`, error instanceof Error ? error.message : error);

      // Continue to next attempt
      const isLastAttempt = attempts.indexOf(attempt) === attempts.length - 1;
      if (isLastAttempt) {
        // This was the last attempt
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          attempts: attempts.map((a) => a.name),
          troubleshooting: {
            sslError:
              error instanceof Error &&
              (error.message.includes('SSL') || error.message.includes('TLS')),
            networkError: error instanceof Error && error.message.includes('ENOTFOUND'),
            authError: error instanceof Error && error.message.includes('authentication'),
            timeoutError: error instanceof Error && error.message.includes('timeout'),
            atlasSpecific: error instanceof Error && error.message.includes('ssl3_read_bytes'),
          },
        };
      }
    }
  }

  return {
    success: false,
    error: 'All connection attempts failed',
  };
}
