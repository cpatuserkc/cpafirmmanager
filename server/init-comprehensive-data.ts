import { db } from './db';
import {
  users, firms, professionalRoles, services, contacts,
  clientCompanies, projects, proposals, deadlines
} from '@shared/schema';
import { count, eq } from 'drizzle-orm';
import {
  sampleUsers, sampleFirms, sampleProfessionalRoles, sampleServices,
  sampleContacts, sampleClientCompanies, sampleProjects, sampleProposals,
  sampleDeadlines
} from './sample-data';

/**
 * Initializes the database with comprehensive sample data
 * This creates a realistic data set for demonstration and development
 */
export async function initComprehensiveData() {
  console.log("Adding comprehensive sample data to database...");
  
  try {
    // Create users
    const createdUsers = await createSampleUsers();
    if (!createdUsers) return;
    
    // Get admin user (first user) for subsequent operations
    const [adminUser] = await db.select().from(users).where(eq(users.username, 'admin'));
    if (!adminUser) {
      console.error("Admin user not found!");
      return;
    }
    
    // Create firms
    const createdFirms = await createSampleFirms(adminUser.id);
    if (!createdFirms) return;
    
    // Get created firms for subsequent operations
    const allFirms = await db.select().from(firms);
    if (allFirms.length < 2) {
      console.error("Not enough firms created!");
      return;
    }
    
    // Create user-firm relationships
    await createUserFirmRelationships(adminUser.id, allFirms);
    
    // Create professional roles for each firm
    await createSampleProfessionalRoles(adminUser.id, allFirms);
    
    // Create services for each firm
    await createSampleServices(adminUser.id, allFirms);
    
    // Create contacts for each firm
    const createdContacts = await createSampleContacts(adminUser.id, allFirms);
    if (!createdContacts) return;
    
    // Get created contacts for subsequent operations
    const allContacts = await db.select().from(contacts);
    if (allContacts.length === 0) {
      console.error("No contacts created!");
      return;
    }
    
    // Create client companies linked to contacts
    const createdClientCompanies = await createSampleClientCompanies(adminUser.id, allFirms, allContacts);
    if (!createdClientCompanies) return;
    
    // Get created client companies for subsequent operations
    const allClientCompanies = await db.select().from(clientCompanies);
    if (allClientCompanies.length === 0) {
      console.error("No client companies created!");
      return;
    }
    
    // Create projects for client companies
    await createSampleProjects(adminUser.id, allFirms, allClientCompanies);
    
    // Create proposals
    await createSampleProposals(adminUser.id, allFirms, allContacts, allClientCompanies);
    
    // Create deadlines
    await createSampleDeadlines(adminUser.id, allFirms, allContacts, allClientCompanies);
    
    console.log("Comprehensive sample data added successfully!");
    return true;
  } catch (error) {
    console.error("Error adding comprehensive sample data:", error);
    return false;
  }
}

/**
 * Creates sample users
 */
async function createSampleUsers() {
  const [userCount] = await db.select({ count: count() }).from(users);
  
  if (userCount && parseInt(userCount.count.toString()) >= sampleUsers.length) {
    console.log("Users already exist, skipping user creation");
    return true;
  }
  
  console.log("Adding sample users");
  
  try {
    // Convert snake_case to camelCase for Drizzle schema
    const mappedUsers = sampleUsers.map(user => ({
      username: user.username,
      password: user.password,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active
    }));
    
    await db.insert(users).values(mappedUsers);
    return true;
  } catch (error) {
    console.error("Error creating sample users:", error);
    return false;
  }
}

/**
 * Creates sample firms
 */
async function createSampleFirms(adminUserId: number) {
  const [firmCount] = await db.select({ count: count() }).from(firms);
  
  if (firmCount && parseInt(firmCount.count.toString()) >= sampleFirms.length) {
    console.log("Firms already exist, skipping firm creation");
    return true;
  }
  
  console.log("Adding sample firms");
  
  try {
    // Add admin_user_id to each firm
    const firmsWithAdmin = sampleFirms.map(firm => ({
      ...firm,
      admin_user_id: adminUserId
    }));
    
    await db.insert(firms).values(firmsWithAdmin);
    return true;
  } catch (error) {
    console.error("Error creating sample firms:", error);
    return false;
  }
}

/**
 * Creates user-firm relationships
 */
async function createUserFirmRelationships(adminUserId: number, allFirms: any[]) {
  console.log("Adding user-firm relationships");
  
  try {
    // Get all non-admin users
    const allUsers = await db.select().from(users).where(eq(users.role, 'professional'));
    
    if (allUsers.length === 0) {
      console.log("No professional users found, skipping relationship creation");
      return true;
    }
    
    // Create relationships - assign users to firms
    const relationships = [];
    
    // Add admin user to all firms as owner
    for (const firm of allFirms) {
      relationships.push({
        user_id: adminUserId,
        firm_id: firm.id,
        role: 'owner'
      });
    }
    
    // Add first two professional users to first firm
    if (allUsers.length >= 2 && allFirms.length >= 1) {
      relationships.push({
        user_id: allUsers[0].id,
        firm_id: allFirms[0].id,
        role: 'manager'
      });
      
      relationships.push({
        user_id: allUsers[1].id,
        firm_id: allFirms[0].id,
        role: 'employee'
      });
    }
    
    // Add other professional users to second firm
    if (allUsers.length >= 4 && allFirms.length >= 2) {
      relationships.push({
        user_id: allUsers[2].id,
        firm_id: allFirms[1].id,
        role: 'manager'
      });
      
      relationships.push({
        user_id: allUsers[3].id,
        firm_id: allFirms[1].id,
        role: 'employee'
      });
    }
    
    if (relationships.length > 0) {
      await db.insert(users).values(relationships).onConflictDoNothing();
    }
    
    return true;
  } catch (error) {
    console.error("Error creating user-firm relationships:", error);
    return false;
  }
}

/**
 * Creates professional roles for firms
 */
async function createSampleProfessionalRoles(createdById: number, allFirms: any[]) {
  const [roleCount] = await db.select({ count: count() }).from(professionalRoles);
  
  if (roleCount && parseInt(roleCount.count.toString()) >= sampleProfessionalRoles.length * allFirms.length) {
    console.log("Professional roles already exist, skipping role creation");
    return true;
  }
  
  console.log("Adding professional roles");
  
  try {
    // Create roles for each firm
    for (const firm of allFirms) {
      const rolesForFirm = sampleProfessionalRoles.map(role => ({
        ...role,
        firm_id: firm.id,
        created_by_id: createdById
      }));
      
      await db.insert(professionalRoles).values(rolesForFirm);
    }
    
    return true;
  } catch (error) {
    console.error("Error creating professional roles:", error);
    return false;
  }
}

/**
 * Creates services for firms
 */
async function createSampleServices(createdById: number, allFirms: any[]) {
  const [serviceCount] = await db.select({ count: count() }).from(services);
  
  if (serviceCount && parseInt(serviceCount.count.toString()) >= sampleServices.length * allFirms.length) {
    console.log("Services already exist, skipping service creation");
    return true;
  }
  
  console.log("Adding services");
  
  try {
    // Create services for each firm
    for (const firm of allFirms) {
      const servicesForFirm = sampleServices.map(service => ({
        ...service,
        firm_id: firm.id,
        created_by_id: createdById
      }));
      
      await db.insert(services).values(servicesForFirm);
    }
    
    return true;
  } catch (error) {
    console.error("Error creating services:", error);
    return false;
  }
}

/**
 * Creates contacts for firms
 */
async function createSampleContacts(createdById: number, allFirms: any[]) {
  const [contactCount] = await db.select({ count: count() }).from(contacts);
  
  if (contactCount && parseInt(contactCount.count.toString()) >= sampleContacts.length) {
    console.log("Contacts already exist, skipping contact creation");
    return true;
  }
  
  console.log("Adding contacts");
  
  try {
    // Distribute contacts between firms
    const halfIndex = Math.ceil(sampleContacts.length / 2);
    
    if (allFirms.length >= 2) {
      // First half of contacts for first firm
      const firstFirmContacts = sampleContacts.slice(0, halfIndex).map(contact => ({
        ...contact,
        firm_id: allFirms[0].id,
        created_by_id: createdById
      }));
      
      // Second half of contacts for second firm
      const secondFirmContacts = sampleContacts.slice(halfIndex).map(contact => ({
        ...contact,
        firm_id: allFirms[1].id,
        created_by_id: createdById
      }));
      
      await db.insert(contacts).values([...firstFirmContacts, ...secondFirmContacts]);
    } else if (allFirms.length === 1) {
      // All contacts for the single firm
      const firmContacts = sampleContacts.map(contact => ({
        ...contact,
        firm_id: allFirms[0].id,
        created_by_id: createdById
      }));
      
      await db.insert(contacts).values(firmContacts);
    }
    
    return true;
  } catch (error) {
    console.error("Error creating contacts:", error);
    return false;
  }
}

/**
 * Creates client companies linked to contacts
 */
async function createSampleClientCompanies(createdById: number, allFirms: any[], allContacts: any[]) {
  const [companyCount] = await db.select({ count: count() }).from(clientCompanies);
  
  if (companyCount && parseInt(companyCount.count.toString()) >= sampleClientCompanies.length) {
    console.log("Client companies already exist, skipping company creation");
    return true;
  }
  
  console.log("Adding client companies");
  
  try {
    if (allContacts.length < sampleClientCompanies.length) {
      console.error("Not enough contacts to create client companies");
      return false;
    }
    
    // Link each client company to a contact and firm
    const companiesWithLinks = sampleClientCompanies.map((company, index) => {
      const contact = allContacts[index];
      return {
        ...company,
        firm_id: contact.firm_id,
        contact_id: contact.id,
        created_by_id: createdById
      };
    });
    
    await db.insert(clientCompanies).values(companiesWithLinks);
    return true;
  } catch (error) {
    console.error("Error creating client companies:", error);
    return false;
  }
}

/**
 * Creates projects for client companies
 */
async function createSampleProjects(createdById: number, allFirms: any[], allClientCompanies: any[]) {
  const [projectCount] = await db.select({ count: count() }).from(projects);
  
  if (projectCount && parseInt(projectCount.count.toString()) >= sampleProjects.length) {
    console.log("Projects already exist, skipping project creation");
    return true;
  }
  
  console.log("Adding projects");
  
  try {
    if (allClientCompanies.length < sampleProjects.length) {
      console.error("Not enough client companies to create projects");
      return false;
    }
    
    // Link each project to a client company
    const projectsWithLinks = sampleProjects.map((project, index) => {
      const clientCompany = allClientCompanies[index];
      return {
        ...project,
        firm_id: clientCompany.firm_id,
        client_company_id: clientCompany.id,
        created_by_id: createdById
      };
    });
    
    await db.insert(projects).values(projectsWithLinks);
    return true;
  } catch (error) {
    console.error("Error creating projects:", error);
    return false;
  }
}

/**
 * Creates proposals
 */
async function createSampleProposals(
  createdById: number, 
  allFirms: any[], 
  allContacts: any[], 
  allClientCompanies: any[]
) {
  const [proposalCount] = await db.select({ count: count() }).from(proposals);
  
  if (proposalCount && parseInt(proposalCount.count.toString()) >= sampleProposals.length) {
    console.log("Proposals already exist, skipping proposal creation");
    return true;
  }
  
  console.log("Adding proposals");
  
  try {
    if (allClientCompanies.length < sampleProposals.length || allContacts.length < sampleProposals.length) {
      console.error("Not enough client companies or contacts to create proposals");
      return false;
    }
    
    // Link each proposal to a client company and contact
    const proposalsWithLinks = sampleProposals.map((proposal, index) => {
      const clientCompany = allClientCompanies[index];
      const contact = allContacts[index];
      
      // Basic proposal data
      const proposalData = {
        ...proposal,
        firm_id: clientCompany.firm_id,
        client_company_id: clientCompany.id,
        contact_id: contact.id,
        created_by_id: createdById
      };
      
      // Remove request_details from the main object
      const { request_details, ...cleanProposalData } = proposalData;
      
      return cleanProposalData;
    });
    
    await db.insert(proposals).values(proposalsWithLinks);
    
    // Update the request_details for external proposals separately
    const createdProposals = await db.select().from(proposals);
    
    // Find external proposals and update their request_details
    for (let i = 0; i < sampleProposals.length; i++) {
      if (sampleProposals[i].source === 'external' && sampleProposals[i].request_details) {
        const correspondingProposal = createdProposals.find(p => p.title === sampleProposals[i].title);
        
        if (correspondingProposal) {
          await db.update(proposals)
            .set({ request_details: sampleProposals[i].request_details })
            .where(eq(proposals.id, correspondingProposal.id));
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error creating proposals:", error);
    return false;
  }
}

/**
 * Creates deadlines
 */
async function createSampleDeadlines(
  createdById: number, 
  allFirms: any[], 
  allContacts: any[], 
  allClientCompanies: any[]
) {
  const [deadlineCount] = await db.select({ count: count() }).from(deadlines);
  
  if (deadlineCount && parseInt(deadlineCount.count.toString()) >= sampleDeadlines.length) {
    console.log("Deadlines already exist, skipping deadline creation");
    return true;
  }
  
  console.log("Adding deadlines");
  
  try {
    if (allClientCompanies.length < sampleDeadlines.length || allContacts.length < sampleDeadlines.length) {
      console.error("Not enough client companies or contacts to create deadlines");
      return false;
    }
    
    // Link each deadline to a client company and contact
    const deadlinesWithLinks = sampleDeadlines.map((deadline, index) => {
      const clientCompany = allClientCompanies[index];
      const contact = allContacts[index];
      
      return {
        ...deadline,
        firm_id: clientCompany.firm_id,
        client_company_id: clientCompany.id,
        contact_id: contact.id,
        created_by_id: createdById
      };
    });
    
    await db.insert(deadlines).values(deadlinesWithLinks);
    return true;
  } catch (error) {
    console.error("Error creating deadlines:", error);
    return false;
  }
}