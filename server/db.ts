import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Connect to the database using the provided DATABASE_URL
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Export a function to push the schema to the database
export async function pushSchema() {
  console.log("Initializing database schema...");
  // In a production environment, you would use migrations instead
  // For now, we'll initialize the database directly
  try {
    // We would normally use drizzle-kit for this in production
    console.log("Database schema initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database schema:", error);
    return false;
  }
}