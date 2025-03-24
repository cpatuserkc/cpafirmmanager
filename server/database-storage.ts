import {
  users, type User, type InsertUser,
  firms, type Firm, type InsertFirm,
  userFirmRelationships, type UserFirmRelationship, type InsertUserFirmRelationship,
  contacts, type Contact, type InsertContact,
  clientCompanies, type ClientCompany, type InsertClientCompany,
  projects, type Project, type InsertProject,
  timeEstimates, type TimeEstimate, type InsertTimeEstimate, 
  professionalRoles, type ProfessionalRole, type InsertProfessionalRole,
  services, type Service, type InsertService,
  proposals, type Proposal, type InsertProposal,
  proposalServices, type ProposalService, type InsertProposalService,
  resources, type Resource, type InsertResource,
  classifications, type Classification, type InsertClassification,
  deadlines, type Deadline, type InsertDeadline
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte } from "drizzle-orm";
import { IStorage } from "./storage";

/**
 * Database storage implementation using Drizzle ORM
 */
export class DatabaseStorage implements IStorage {
  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Firm Operations
  async getFirm(id: number): Promise<Firm | undefined> {
    const [firm] = await db.select().from(firms).where(eq(firms.id, id));
    return firm;
  }
  
  async getFirmsByUserId(userId: number): Promise<Firm[]> {
    const relationships = await this.getUserFirmRelationshipsByUserId(userId);
    const firmIds = relationships.map(rel => rel.firmId);
    
    if (firmIds.length === 0) {
      return [];
    }
    
    return await db.select().from(firms).where(
      firms.id.in(firmIds)
    );
  }
  
  async createFirm(firm: InsertFirm): Promise<Firm> {
    const [newFirm] = await db.insert(firms).values(firm).returning();
    return newFirm;
  }
  
  async updateFirm(id: number, data: Partial<Firm>): Promise<Firm | undefined> {
    const [updatedFirm] = await db.update(firms)
      .set(data)
      .where(eq(firms.id, id))
      .returning();
    return updatedFirm;
  }
  
  async deleteFirm(id: number): Promise<boolean> {
    const result = await db.delete(firms).where(eq(firms.id, id));
    return result.rowCount > 0;
  }
  
  // User-Firm Relationship Operations
  async getUserFirmRelationship(id: number): Promise<UserFirmRelationship | undefined> {
    const [relationship] = await db.select().from(userFirmRelationships).where(eq(userFirmRelationships.id, id));
    return relationship;
  }
  
  async getUserFirmRelationshipsByUserId(userId: number): Promise<UserFirmRelationship[]> {
    return await db.select().from(userFirmRelationships).where(eq(userFirmRelationships.userId, userId));
  }
  
  async getUserFirmRelationshipsByFirmId(firmId: number): Promise<UserFirmRelationship[]> {
    return await db.select().from(userFirmRelationships).where(eq(userFirmRelationships.firmId, firmId));
  }
  
  async createUserFirmRelationship(relationship: InsertUserFirmRelationship): Promise<UserFirmRelationship> {
    const [newRelationship] = await db.insert(userFirmRelationships).values(relationship).returning();
    return newRelationship;
  }
  
  async deleteUserFirmRelationship(id: number): Promise<boolean> {
    const result = await db.delete(userFirmRelationships).where(eq(userFirmRelationships.id, id));
    return result.rowCount > 0;
  }
  
  // Contact Operations
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }
  
  async getContactsByFirmId(firmId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.firmId, firmId));
  }
  
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }
  
  async updateContact(id: number, data: Partial<Contact>): Promise<Contact | undefined> {
    const [updatedContact] = await db.update(contacts)
      .set(data)
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }
  
  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount > 0;
  }
  
  // Client Company Operations
  async getClientCompany(id: number): Promise<ClientCompany | undefined> {
    const [company] = await db.select().from(clientCompanies).where(eq(clientCompanies.id, id));
    return company;
  }
  
  async getClientCompaniesByFirmId(firmId: number): Promise<ClientCompany[]> {
    return await db.select().from(clientCompanies).where(eq(clientCompanies.firmId, firmId));
  }
  
  async getClientCompaniesByContactId(contactId: number): Promise<ClientCompany[]> {
    return await db.select().from(clientCompanies).where(eq(clientCompanies.contactId, contactId));
  }
  
  async createClientCompany(company: InsertClientCompany): Promise<ClientCompany> {
    const [newCompany] = await db.insert(clientCompanies).values(company).returning();
    return newCompany;
  }
  
  async updateClientCompany(id: number, data: Partial<ClientCompany>): Promise<ClientCompany | undefined> {
    const [updatedCompany] = await db.update(clientCompanies)
      .set(data)
      .where(eq(clientCompanies.id, id))
      .returning();
    return updatedCompany;
  }
  
  async deleteClientCompany(id: number): Promise<boolean> {
    const result = await db.delete(clientCompanies).where(eq(clientCompanies.id, id));
    return result.rowCount > 0;
  }
  
  // Project Operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async getProjectsByFirmId(firmId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.firmId, firmId));
  }
  
  async getProjectsByClientCompanyId(clientCompanyId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.clientCompanyId, clientCompanyId));
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }
  
  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db.update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }
  
  // Professional Role Operations
  async getProfessionalRole(id: number): Promise<ProfessionalRole | undefined> {
    const [role] = await db.select().from(professionalRoles).where(eq(professionalRoles.id, id));
    return role;
  }
  
  async getProfessionalRolesByFirmId(firmId: number): Promise<ProfessionalRole[]> {
    return await db.select().from(professionalRoles).where(eq(professionalRoles.firmId, firmId));
  }
  
  async createProfessionalRole(role: InsertProfessionalRole): Promise<ProfessionalRole> {
    const [newRole] = await db.insert(professionalRoles).values(role).returning();
    return newRole;
  }
  
  async updateProfessionalRole(id: number, data: Partial<ProfessionalRole>): Promise<ProfessionalRole | undefined> {
    const [updatedRole] = await db.update(professionalRoles)
      .set(data)
      .where(eq(professionalRoles.id, id))
      .returning();
    return updatedRole;
  }
  
  async deleteProfessionalRole(id: number): Promise<boolean> {
    const result = await db.delete(professionalRoles).where(eq(professionalRoles.id, id));
    return result.rowCount > 0;
  }
  
  // Service Operations
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  
  async getServicesByFirmId(firmId: number): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.firmId, firmId));
  }
  
  async getServicesByCategory(firmId: number, category: string): Promise<Service[]> {
    return await db.select().from(services).where(
      and(
        eq(services.firmId, firmId),
        eq(services.category, category)
      )
    );
  }
  
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  
  async updateService(id: number, data: Partial<Service>): Promise<Service | undefined> {
    const [updatedService] = await db.update(services)
      .set(data)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }
  
  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return result.rowCount > 0;
  }
  
  // Time Estimate Operations
  async getTimeEstimate(id: number): Promise<TimeEstimate | undefined> {
    const [timeEstimate] = await db.select().from(timeEstimates).where(eq(timeEstimates.id, id));
    return timeEstimate;
  }
  
  async getTimeEstimatesByFirmId(firmId: number, limit?: number): Promise<TimeEstimate[]> {
    let query = db.select().from(timeEstimates).where(eq(timeEstimates.firmId, firmId));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getTimeEstimatesByAssignedUserId(userId: number, limit?: number): Promise<TimeEstimate[]> {
    let query = db.select().from(timeEstimates).where(eq(timeEstimates.assignedUserId, userId));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getTimeEstimatesByClientCompanyId(clientCompanyId: number): Promise<TimeEstimate[]> {
    // First get projects associated with this client
    const clientProjects = await this.getProjectsByClientCompanyId(clientCompanyId);
    
    if (clientProjects.length === 0) {
      return [];
    }
    
    const projectIds = clientProjects.map(project => project.id);
    
    // Then get time estimates for these projects
    return await db.select().from(timeEstimates).where(
      timeEstimates.projectId.in(projectIds)
    );
  }
  
  async getTimeEstimatesByProjectId(projectId: number): Promise<TimeEstimate[]> {
    return await db.select().from(timeEstimates).where(eq(timeEstimates.projectId, projectId));
  }
  
  async createTimeEstimate(timeEstimate: InsertTimeEstimate): Promise<TimeEstimate> {
    const [newTimeEstimate] = await db.insert(timeEstimates).values(timeEstimate).returning();
    return newTimeEstimate;
  }
  
  async updateTimeEstimate(id: number, data: Partial<TimeEstimate>): Promise<TimeEstimate | undefined> {
    const [updatedTimeEstimate] = await db.update(timeEstimates)
      .set(data)
      .where(eq(timeEstimates.id, id))
      .returning();
    return updatedTimeEstimate;
  }
  
  async deleteTimeEstimate(id: number): Promise<boolean> {
    const result = await db.delete(timeEstimates).where(eq(timeEstimates.id, id));
    return result.rowCount > 0;
  }
  
  // Proposal Operations
  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }
  
  async getProposalsByFirmId(firmId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.firmId, firmId));
  }
  
  async getProposalsByContactId(contactId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.contactId, contactId));
  }
  
  async getProposalsByClientCompanyId(clientCompanyId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.clientCompanyId, clientCompanyId));
  }
  
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db.insert(proposals).values(proposal).returning();
    return newProposal;
  }
  
  async updateProposal(id: number, data: Partial<Proposal>): Promise<Proposal | undefined> {
    const [updatedProposal] = await db.update(proposals)
      .set(data)
      .where(eq(proposals.id, id))
      .returning();
    return updatedProposal;
  }
  
  async deleteProposal(id: number): Promise<boolean> {
    const result = await db.delete(proposals).where(eq(proposals.id, id));
    return result.rowCount > 0;
  }
  
  // Proposal Service Operations
  async getProposalService(id: number): Promise<ProposalService | undefined> {
    const [proposalService] = await db.select().from(proposalServices).where(eq(proposalServices.id, id));
    return proposalService;
  }
  
  async getProposalServicesByProposalId(proposalId: number): Promise<ProposalService[]> {
    return await db.select().from(proposalServices).where(eq(proposalServices.proposalId, proposalId));
  }
  
  async createProposalService(proposalService: InsertProposalService): Promise<ProposalService> {
    const [newProposalService] = await db.insert(proposalServices).values(proposalService).returning();
    return newProposalService;
  }
  
  async updateProposalService(id: number, data: Partial<ProposalService>): Promise<ProposalService | undefined> {
    const [updatedProposalService] = await db.update(proposalServices)
      .set(data)
      .where(eq(proposalServices.id, id))
      .returning();
    return updatedProposalService;
  }
  
  async deleteProposalService(id: number): Promise<boolean> {
    const result = await db.delete(proposalServices).where(eq(proposalServices.id, id));
    return result.rowCount > 0;
  }
  
  // Resource Operations
  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }
  
  async getAllResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }
  
  async getResourcesByType(type: string): Promise<Resource[]> {
    return await db.select().from(resources).where(eq(resources.type, type));
  }
  
  async getResourcesByAccessLevel(accessLevel: string): Promise<Resource[]> {
    return await db.select().from(resources).where(eq(resources.accessLevel, accessLevel));
  }
  
  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }
  
  async updateResource(id: number, data: Partial<Resource>): Promise<Resource | undefined> {
    const [updatedResource] = await db.update(resources)
      .set(data)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }
  
  async deleteResource(id: number): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return result.rowCount > 0;
  }
  
  // Classification Operations
  async getClassification(id: number): Promise<Classification | undefined> {
    const [classification] = await db.select().from(classifications).where(eq(classifications.id, id));
    return classification;
  }
  
  async getAllClassifications(): Promise<Classification[]> {
    return await db.select().from(classifications);
  }
  
  async getClassificationsByCategory(category: string): Promise<Classification[]> {
    return await db.select().from(classifications).where(eq(classifications.category, category));
  }
  
  async getClassificationsByAccessLevel(accessLevel: string): Promise<Classification[]> {
    return await db.select().from(classifications).where(eq(classifications.accessLevel, accessLevel));
  }
  
  async createClassification(classification: InsertClassification): Promise<Classification> {
    const [newClassification] = await db.insert(classifications).values(classification).returning();
    return newClassification;
  }
  
  async updateClassification(id: number, data: Partial<Classification>): Promise<Classification | undefined> {
    const [updatedClassification] = await db.update(classifications)
      .set(data)
      .where(eq(classifications.id, id))
      .returning();
    return updatedClassification;
  }
  
  async deleteClassification(id: number): Promise<boolean> {
    const result = await db.delete(classifications).where(eq(classifications.id, id));
    return result.rowCount > 0;
  }
  
  // Deadline Operations
  async getDeadline(id: number): Promise<Deadline | undefined> {
    const [deadline] = await db.select().from(deadlines).where(eq(deadlines.id, id));
    return deadline;
  }
  
  async getDeadlinesByFirmId(firmId: number): Promise<Deadline[]> {
    return await db.select().from(deadlines).where(eq(deadlines.firmId, firmId));
  }
  
  async getDeadlinesByContactId(contactId: number): Promise<Deadline[]> {
    return await db.select().from(deadlines).where(eq(deadlines.contactId, contactId));
  }
  
  async getDeadlinesByClientCompanyId(clientCompanyId: number): Promise<Deadline[]> {
    return await db.select().from(deadlines).where(eq(deadlines.clientCompanyId, clientCompanyId));
  }
  
  async getUpcomingDeadlinesByFirmId(firmId: number, limit?: number): Promise<Deadline[]> {
    const now = new Date();
    
    let query = db.select()
      .from(deadlines)
      .where(
        and(
          eq(deadlines.firmId, firmId),
          gte(deadlines.dueDate, now)
        )
      )
      .orderBy(deadlines.dueDate);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async createDeadline(deadlineData: InsertDeadline): Promise<Deadline> {
    const [newDeadline] = await db.insert(deadlines).values(deadlineData).returning();
    return newDeadline;
  }
  
  async updateDeadline(id: number, data: Partial<Deadline>): Promise<Deadline | undefined> {
    const [updatedDeadline] = await db.update(deadlines)
      .set(data)
      .where(eq(deadlines.id, id))
      .returning();
    return updatedDeadline;
  }
  
  async deleteDeadline(id: number): Promise<boolean> {
    const result = await db.delete(deadlines).where(eq(deadlines.id, id));
    return result.rowCount > 0;
  }
}