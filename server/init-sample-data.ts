import { db } from './db';
import { resources, classifications, users } from '@shared/schema';
import { eq, SQL, count } from 'drizzle-orm';

/**
 * Initializes the database with sample data
 */
export async function initSampleData() {
  console.log("Adding sample data to database...");
  
  try {
    // Create admin user if it doesn't exist
    const adminUser = await createAdminUser();
    
    // Add sample resources
    await addSampleResources(adminUser.id);
    
    // Add sample classifications
    await addSampleClassifications(adminUser.id);
    
    console.log("Sample data added successfully!");
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

/**
 * Creates an admin user if one doesn't exist
 */
async function createAdminUser() {
  const [existingUser] = await db.select().from(users).where(eq(users.username, 'admin'));
  
  if (existingUser) {
    console.log("Admin user already exists");
    return existingUser;
  }
  
  console.log("Creating admin user");
  const [adminUser] = await db.insert(users).values({
    username: 'admin',
    password: 'admin', // In production, this would be hashed
    email: 'admin@cpafirmmanager.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true
  }).returning();
  
  return adminUser;
}

/**
 * Adds sample resources to the database
 */
async function addSampleResources(createdById: number) {
  const [resourceCount] = await db.select({ count: count() }).from(resources);
  
  if (resourceCount && parseInt(resourceCount.count.toString()) > 0) {
    console.log("Resources already exist, skipping");
    return;
  }
  
  console.log("Adding sample resources");
  
  const resourcesData = [
    {
      title: "Client Onboarding Template",
      description: "Streamline your client intake process with our comprehensive onboarding template.",
      url: "/resources/client-onboarding-template.pdf",
      type: "template",
      access_level: "free",
      category: "Practice Management",
      created_by_id: createdById
    },
    {
      title: "Advanced Time Tracking Guide",
      description: "Master effective time tracking strategies to maximize billable hours and profitability.",
      url: "/resources/time-tracking-guide.pdf",
      type: "guide",
      access_level: "premium",
      category: "Time Management",
      created_by_id: createdById
    },
    {
      title: "Tax Classification Cheat Sheet",
      description: "Quick reference guide to common tax classifications for small business clients.",
      url: "/resources/tax-classification-cheatsheet.pdf",
      type: "tool",
      access_level: "free",
      category: "Tax",
      created_by_id: createdById
    }
  ];
  
  await db.insert(resources).values(resourcesData);
}

/**
 * Adds sample classifications to the database
 */
async function addSampleClassifications(createdById: number) {
  const [classificationCount] = await db.select({ count: count() }).from(classifications);
  
  if (classificationCount && parseInt(classificationCount.count.toString()) > 0) {
    console.log("Classifications already exist, skipping");
    return;
  }
  
  console.log("Adding sample classifications");
  
  const classificationsData = [
    {
      name: "Business Entity Types",
      description: "Classifications of different business entity types for tax purposes",
      category: "Tax",
      access_level: "free",
      created_by_id: createdById
    },
    {
      name: "Chart of Accounts",
      description: "Standard chart of accounts for small businesses",
      category: "Accounting",
      access_level: "free",
      created_by_id: createdById
    },
    {
      name: "Income Categories",
      description: "Classifications of different income types",
      category: "Tax",
      access_level: "premium",
      created_by_id: createdById
    }
  ];
  
  await db.insert(classifications).values(classificationsData);
}