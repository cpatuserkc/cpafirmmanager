import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { sql as sqlObj } from 'drizzle-orm';

// Connect to the database using the provided DATABASE_URL
const sql = neon(process.env.DATABASE_URL!);
// Create a pooled client for better connection management
export const db = drizzle(sql, { schema });

// Export a function to push the schema to the database
export async function pushSchema() {
  console.log("Initializing database schema...");
  // In a production environment, you would use migrations instead
  // For now, we'll initialize the database directly
  try {
    // Create tables for all models
    await createUsers();
    await createFirms();
    await createUserFirmRelationships();
    await createContacts();
    await createClientCompanies();
    await createProjects();
    await createProfessionalRoles();
    await createServices();
    await createTimeEstimates();
    await createProposals();
    await createProposalServices();
    await createResources();
    await createClassifications();
    await createDeadlines();
    
    console.log("Database schema initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database schema:", error);
    return false;
  }
}

// Helper functions to create tables
async function createUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

async function createFirms() {
  await sql`
    CREATE TABLE IF NOT EXISTS firms (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      admin_user_id INTEGER NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      website TEXT,
      email TEXT,
      phone TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

async function createUserFirmRelationships() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_firm_relationships (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      firm_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (firm_id) REFERENCES firms(id)
    )
  `;
}

async function createContacts() {
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      notes TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    )
  `;
}

async function createClientCompanies() {
  await sql`
    CREATE TABLE IF NOT EXISTS client_companies (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      contact_id INTEGER NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      website TEXT,
      industry TEXT,
      ein TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `;
}

async function createProjects() {
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      client_company_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      estimated_hours TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id),
      FOREIGN KEY (client_company_id) REFERENCES client_companies(id)
    )
  `;
}

async function createProfessionalRoles() {
  await sql`
    CREATE TABLE IF NOT EXISTS professional_roles (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      top_tier_rate TEXT NOT NULL,
      mid_tier_rate_percent TEXT NOT NULL,
      low_tier_rate_percent TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    )
  `;
}

async function createServices() {
  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      default_rate TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    )
  `;
}

async function createTimeEstimates() {
  await sql`
    CREATE TABLE IF NOT EXISTS time_estimates (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      service_id INTEGER,
      professional_role_id INTEGER NOT NULL,
      description TEXT,
      assigned_user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      estimated_hours TEXT NOT NULL,
      hourly_rate TEXT NOT NULL,
      tier TEXT NOT NULL,
      start_date TIMESTAMP,
      due_date TIMESTAMP,
      estimated_cost TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (professional_role_id) REFERENCES professional_roles(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id)
    )
  `;
}

async function createProposals() {
  await sql`
    CREATE TABLE IF NOT EXISTS proposals (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      client_company_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT NOT NULL,
      estimated_cost TEXT,
      estimated_hours TEXT,
      expiry_date TIMESTAMP,
      estimated_start_date TIMESTAMP,
      estimated_end_date TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id),
      FOREIGN KEY (client_company_id) REFERENCES client_companies(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `;
}

async function createProposalServices() {
  await sql`
    CREATE TABLE IF NOT EXISTS proposal_services (
      id SERIAL PRIMARY KEY,
      proposal_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      professional_role_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      description TEXT,
      estimated_hours TEXT NOT NULL,
      tier TEXT NOT NULL,
      rate NUMERIC NOT NULL,
      total_amount NUMERIC NOT NULL,
      jurisdiction_federal BOOLEAN NOT NULL DEFAULT false,
      jurisdiction_state TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (proposal_id) REFERENCES proposals(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (professional_role_id) REFERENCES professional_roles(id)
    )
  `;
}

async function createResources() {
  await sql`
    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      access_level TEXT NOT NULL,
      category TEXT NOT NULL,
      created_by_id INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    )
  `;
}

async function createClassifications() {
  await sql`
    CREATE TABLE IF NOT EXISTS classifications (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      access_level TEXT NOT NULL,
      created_by_id INTEGER NOT NULL,
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    )
  `;
}

async function createDeadlines() {
  await sql`
    CREATE TABLE IF NOT EXISTS deadlines (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      client_company_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TIMESTAMP NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (firm_id) REFERENCES firms(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id),
      FOREIGN KEY (client_company_id) REFERENCES client_companies(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `;
}