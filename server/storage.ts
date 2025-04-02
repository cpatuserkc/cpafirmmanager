import {
  type User,
  type InsertUser,
  type Firm,
  type InsertFirm,
  type UserFirmRelationship,
  type InsertUserFirmRelationship,
  type Contact,
  type InsertContact,
  type ClientCompany,
  type InsertClientCompany,
  type Project,
  type InsertProject,
  type TimeEstimate,
  type InsertTimeEstimate,
  type ProfessionalRole,
  type InsertProfessionalRole,
  type Service,
  type InsertService,
  type Proposal,
  type InsertProposal,
  type ProposalService,
  type InsertProposalService,
  type Resource,
  type InsertResource,
  type Classification,
  type InsertClassification,
  type Deadline,
  type InsertDeadline
} from "@shared/schema";
// Temporarily use memory storage to avoid database issues
// import { DatabaseStorage } from './database-storage';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Firm operations
  getFirm(id: number): Promise<Firm | undefined>;
  getFirmsByUserId(userId: number): Promise<Firm[]>;
  createFirm(firm: InsertFirm): Promise<Firm>;
  updateFirm(id: number, data: Partial<Firm>): Promise<Firm | undefined>;
  deleteFirm(id: number): Promise<boolean>;
  
  // User-Firm relationship operations
  getUserFirmRelationship(id: number): Promise<UserFirmRelationship | undefined>;
  getUserFirmRelationshipsByUserId(userId: number): Promise<UserFirmRelationship[]>;
  getUserFirmRelationshipsByFirmId(firmId: number): Promise<UserFirmRelationship[]>;
  createUserFirmRelationship(relationship: InsertUserFirmRelationship): Promise<UserFirmRelationship>;
  deleteUserFirmRelationship(id: number): Promise<boolean>;
  
  // Contact operations
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByFirmId(firmId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Client Company operations
  getClientCompany(id: number): Promise<ClientCompany | undefined>;
  getClientCompaniesByFirmId(firmId: number): Promise<ClientCompany[]>;
  getClientCompaniesByContactId(contactId: number): Promise<ClientCompany[]>;
  createClientCompany(company: InsertClientCompany): Promise<ClientCompany>;
  updateClientCompany(id: number, data: Partial<ClientCompany>): Promise<ClientCompany | undefined>;
  deleteClientCompany(id: number): Promise<boolean>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByFirmId(firmId: number): Promise<Project[]>;
  getProjectsByClientCompanyId(clientCompanyId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Time estimate operations
  getTimeEstimate(id: number): Promise<TimeEstimate | undefined>;
  getTimeEstimatesByFirmId(firmId: number, limit?: number): Promise<TimeEstimate[]>;
  getTimeEstimatesByAssignedUserId(userId: number, limit?: number): Promise<TimeEstimate[]>;
  getTimeEstimatesByClientCompanyId(clientCompanyId: number): Promise<TimeEstimate[]>;
  getTimeEstimatesByProjectId(projectId: number): Promise<TimeEstimate[]>;
  createTimeEstimate(timeEstimate: InsertTimeEstimate): Promise<TimeEstimate>;
  updateTimeEstimate(id: number, data: Partial<TimeEstimate>): Promise<TimeEstimate | undefined>;
  deleteTimeEstimate(id: number): Promise<boolean>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  getServicesByFirmId(firmId: number): Promise<Service[]>;
  getServicesByCategory(firmId: number, category: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, data: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Proposal operations
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposalsByFirmId(firmId: number): Promise<Proposal[]>;
  getProposalsByContactId(contactId: number): Promise<Proposal[]>;
  getProposalsByClientCompanyId(clientCompanyId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, data: Partial<Proposal>): Promise<Proposal | undefined>;
  deleteProposal(id: number): Promise<boolean>;
  
  // Proposal Services operations
  getProposalService(id: number): Promise<ProposalService | undefined>;
  getProposalServicesByProposalId(proposalId: number): Promise<ProposalService[]>;
  createProposalService(proposalService: InsertProposalService): Promise<ProposalService>;
  updateProposalService(id: number, data: Partial<ProposalService>): Promise<ProposalService | undefined>;
  deleteProposalService(id: number): Promise<boolean>;

  // Resource operations
  getResource(id: number): Promise<Resource | undefined>;
  getAllResources(): Promise<Resource[]>;
  getResourcesByType(type: string): Promise<Resource[]>;
  getResourcesByAccessLevel(accessLevel: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, data: Partial<Resource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;

  // Classification operations
  getClassification(id: number): Promise<Classification | undefined>;
  getAllClassifications(): Promise<Classification[]>;
  getClassificationsByCategory(category: string): Promise<Classification[]>;
  getClassificationsByAccessLevel(accessLevel: string): Promise<Classification[]>;
  createClassification(classification: InsertClassification): Promise<Classification>;
  updateClassification(id: number, data: Partial<Classification>): Promise<Classification | undefined>;
  deleteClassification(id: number): Promise<boolean>;

  // Deadline operations
  getDeadline(id: number): Promise<Deadline | undefined>;
  getDeadlinesByFirmId(firmId: number): Promise<Deadline[]>;
  getDeadlinesByContactId(contactId: number): Promise<Deadline[]>;
  getDeadlinesByClientCompanyId(clientCompanyId: number): Promise<Deadline[]>;
  getUpcomingDeadlinesByFirmId(firmId: number, limit?: number): Promise<Deadline[]>;
  createDeadline(deadline: InsertDeadline): Promise<Deadline>;
  updateDeadline(id: number, data: Partial<Deadline>): Promise<Deadline | undefined>;
  deleteDeadline(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Storage maps for each entity type
  private users: Map<number, User>;
  private firms: Map<number, Firm>;
  private userFirmRelationships: Map<number, UserFirmRelationship>;
  private contacts: Map<number, Contact>;
  private clientCompanies: Map<number, ClientCompany>;
  private projects: Map<number, Project>;
  private timeEstimates: Map<number, TimeEstimate>;
  private services: Map<number, Service>;
  private proposals: Map<number, Proposal>;
  private proposalServices: Map<number, ProposalService>;
  private resources: Map<number, Resource>;
  private classifications: Map<number, Classification>;
  private deadlines: Map<number, Deadline>;
  
  // ID counters for each entity type
  private userIdCounter: number;
  private firmIdCounter: number;
  private userFirmRelationshipIdCounter: number;
  private contactIdCounter: number;
  private clientCompanyIdCounter: number;
  private projectIdCounter: number;
  private timeEstimateIdCounter: number;
  private serviceIdCounter: number;
  private proposalIdCounter: number;
  private proposalServiceIdCounter: number;
  private resourceIdCounter: number;
  private classificationIdCounter: number;
  private deadlineIdCounter: number;

  constructor() {
    // Initialize all storage maps
    this.users = new Map();
    this.firms = new Map();
    this.userFirmRelationships = new Map();
    this.contacts = new Map();
    this.clientCompanies = new Map();
    this.projects = new Map();
    this.timeEstimates = new Map();
    this.services = new Map();
    this.proposals = new Map();
    this.proposalServices = new Map();
    this.resources = new Map();
    this.classifications = new Map();
    this.deadlines = new Map();
    
    // Initialize all ID counters
    this.userIdCounter = 1;
    this.firmIdCounter = 1;
    this.userFirmRelationshipIdCounter = 1;
    this.contactIdCounter = 1;
    this.clientCompanyIdCounter = 1;
    this.projectIdCounter = 1;
    this.timeEstimateIdCounter = 1;
    this.serviceIdCounter = 1;
    this.proposalIdCounter = 1;
    this.proposalServiceIdCounter = 1;
    this.resourceIdCounter = 1;
    this.classificationIdCounter = 1;
    this.deadlineIdCounter = 1;
    
    this.initSampleData();
  }

  private initSampleData() {
    // Add admin user for testing
    const adminUser = {
      id: this.userIdCounter++,
      username: "admin",
      password: "6b97ed68d14eb3f1aa959ce5d49c7dc612e1eb1dafd73b1e705847483fd6a638fcfa128a011e7800d1b0af48326a26fd7f7f5abd6ef9e69e48a0c54c6ed2a051.4c8322c23bb8d3075c6fe5fdf8ee5197", // password123
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      phone: null,
      profilePicture: null,
      role: "admin",
      isAdmin: true,
      isActive: true,
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    
    // Add some initial resources
    const resources = [
      {
        id: this.resourceIdCounter++,
        title: "Client Onboarding Template",
        description: "Streamline your client intake process with our comprehensive onboarding template.",
        type: "template",
        accessLevel: "free",
        downloadUrl: "/downloads/client-onboarding-template.pdf",
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
        createdAt: new Date()
      },
      {
        id: this.resourceIdCounter++,
        title: "Advanced Time Tracking Guide",
        description: "Master effective time tracking strategies to maximize billable hours and profitability.",
        type: "guide",
        accessLevel: "premium",
        downloadUrl: "/downloads/time-tracking-guide.pdf",
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
        createdAt: new Date()
      },
      {
        id: this.resourceIdCounter++,
        title: "Tax Classification Cheat Sheet",
        description: "Quick reference guide to common tax classifications for small business clients.",
        type: "tool",
        accessLevel: "free",
        downloadUrl: "/downloads/tax-classification-cheatsheet.pdf",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
        createdAt: new Date()
      }
    ];

    resources.forEach(resource => {
      this.resources.set(resource.id, resource);
    });
    
    // Add sample classifications
    const classifications = [
      {
        id: this.classificationIdCounter++,
        category: "Tax",
        name: "Business Entity Types",
        description: "Classifications of different business entity types for tax purposes",
        details: { items: ["Sole Proprietorship", "Partnership", "LLC", "S-Corporation", "C-Corporation"] },
        accessLevel: "free"
      },
      {
        id: this.classificationIdCounter++,
        category: "Accounting",
        name: "Chart of Accounts",
        description: "Standard chart of accounts for small businesses",
        details: { items: ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"] },
        accessLevel: "free"
      },
      {
        id: this.classificationIdCounter++,
        category: "Tax",
        name: "Income Categories",
        description: "Classifications of different income types",
        details: { items: ["Earned Income", "Passive Income", "Portfolio Income", "Capital Gains"] },
        accessLevel: "premium"
      }
    ];

    classifications.forEach(classification => {
      this.classifications.set(classification.id, classification);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Firm operations
  async getFirm(id: number): Promise<Firm | undefined> {
    return this.firms.get(id);
  }

  async getFirmsByUserId(userId: number): Promise<Firm[]> {
    const userFirmRelationships = Array.from(this.userFirmRelationships.values())
      .filter(relationship => relationship.userId === userId);
    
    return userFirmRelationships.map(relationship => 
      this.firms.get(relationship.firmId)
    ).filter((firm): firm is Firm => firm !== undefined);
  }

  async createFirm(firmData: InsertFirm): Promise<Firm> {
    const id = this.firmIdCounter++;
    const firm: Firm = { 
      ...firmData, 
      id,
      createdAt: new Date(),
      isActive: firmData.isActive ?? true
    };
    this.firms.set(id, firm);
    
    // If a creating user is provided, establish the relationship
    if (firmData.createdById) {
      this.createUserFirmRelationship({
        userId: firmData.createdById,
        firmId: id,
        role: 'owner',
        permissions: ['manage', 'edit', 'view']
      });
    }
    
    return firm;
  }

  async updateFirm(id: number, data: Partial<Firm>): Promise<Firm | undefined> {
    const firm = this.firms.get(id);
    if (!firm) return undefined;
    
    const updatedFirm = { ...firm, ...data };
    this.firms.set(id, updatedFirm);
    return updatedFirm;
  }

  async deleteFirm(id: number): Promise<boolean> {
    // First, delete all related user-firm relationships
    const relationships = Array.from(this.userFirmRelationships.values())
      .filter(rel => rel.firmId === id);
    
    for (const rel of relationships) {
      this.userFirmRelationships.delete(rel.id);
    }
    
    // Then delete the firm
    return this.firms.delete(id);
  }
  
  // User-Firm relationship operations
  async getUserFirmRelationship(id: number): Promise<UserFirmRelationship | undefined> {
    return this.userFirmRelationships.get(id);
  }

  async getUserFirmRelationshipsByUserId(userId: number): Promise<UserFirmRelationship[]> {
    return Array.from(this.userFirmRelationships.values())
      .filter(rel => rel.userId === userId);
  }

  async getUserFirmRelationshipsByFirmId(firmId: number): Promise<UserFirmRelationship[]> {
    return Array.from(this.userFirmRelationships.values())
      .filter(rel => rel.firmId === firmId);
  }

  async createUserFirmRelationship(relationshipData: InsertUserFirmRelationship): Promise<UserFirmRelationship> {
    const id = this.userFirmRelationshipIdCounter++;
    const relationship: UserFirmRelationship = {
      ...relationshipData,
      id,
      createdAt: new Date()
    };
    this.userFirmRelationships.set(id, relationship);
    return relationship;
  }

  async deleteUserFirmRelationship(id: number): Promise<boolean> {
    return this.userFirmRelationships.delete(id);
  }

  // Contact operations
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByFirmId(firmId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      (contact) => contact.firmId === firmId
    );
  }

  async createContact(contactData: InsertContact): Promise<Contact> {
    const id = this.contactIdCounter++;
    const contact: Contact = { 
      ...contactData, 
      id,
      createdAt: new Date() 
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, data: Partial<Contact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...data };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }
  
  // Client Company operations
  async getClientCompany(id: number): Promise<ClientCompany | undefined> {
    return this.clientCompanies.get(id);
  }

  async getClientCompaniesByFirmId(firmId: number): Promise<ClientCompany[]> {
    return Array.from(this.clientCompanies.values()).filter(
      (company) => company.firmId === firmId
    );
  }
  
  async getClientCompaniesByContactId(contactId: number): Promise<ClientCompany[]> {
    return Array.from(this.clientCompanies.values()).filter(
      (company) => company.primaryContactId === contactId
    );
  }

  async createClientCompany(companyData: InsertClientCompany): Promise<ClientCompany> {
    const id = this.clientCompanyIdCounter++;
    const company: ClientCompany = { 
      ...companyData, 
      id,
      createdAt: new Date() 
    };
    this.clientCompanies.set(id, company);
    return company;
  }

  async updateClientCompany(id: number, data: Partial<ClientCompany>): Promise<ClientCompany | undefined> {
    const company = this.clientCompanies.get(id);
    if (!company) return undefined;
    
    const updatedCompany = { ...company, ...data };
    this.clientCompanies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteClientCompany(id: number): Promise<boolean> {
    return this.clientCompanies.delete(id);
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByFirmId(firmId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.firmId === firmId
    );
  }

  async getProjectsByClientCompanyId(clientCompanyId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientCompanyId === clientCompanyId
    );
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = { 
      ...projectData, 
      id,
      createdAt: new Date(),
      status: projectData.status || 'active',
      description: projectData.description || null,
      estimatedHours: projectData.estimatedHours || null,
      startDate: projectData.startDate || null,
      endDate: projectData.endDate || null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...data };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServicesByFirmId(firmId: number): Promise<Service[]> {
    return Array.from(this.services.values())
      .filter(service => service.firmId === firmId);
  }

  async getServicesByCategory(firmId: number, category: string): Promise<Service[]> {
    return Array.from(this.services.values())
      .filter(service => service.firmId === firmId && service.category === category);
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const service: Service = {
      ...serviceData,
      id,
      createdAt: new Date()
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, data: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...data };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Proposal Service operations
  async getProposalService(id: number): Promise<ProposalService | undefined> {
    return this.proposalServices.get(id);
  }

  async getProposalServicesByProposalId(proposalId: number): Promise<ProposalService[]> {
    return Array.from(this.proposalServices.values())
      .filter(proposalService => proposalService.proposalId === proposalId);
  }

  async createProposalService(proposalServiceData: InsertProposalService): Promise<ProposalService> {
    const id = this.proposalServiceIdCounter++;
    const proposalService: ProposalService = {
      ...proposalServiceData,
      id,
      createdAt: new Date()
    };
    this.proposalServices.set(id, proposalService);
    return proposalService;
  }

  async updateProposalService(id: number, data: Partial<ProposalService>): Promise<ProposalService | undefined> {
    const proposalService = this.proposalServices.get(id);
    if (!proposalService) return undefined;
    
    const updatedProposalService = { ...proposalService, ...data };
    this.proposalServices.set(id, updatedProposalService);
    return updatedProposalService;
  }

  async deleteProposalService(id: number): Promise<boolean> {
    return this.proposalServices.delete(id);
  }
  
  // Professional Role operations
  async getProfessionalRole(id: number): Promise<ProfessionalRole | undefined> {
    return this.professionalRoles.get(id);
  }

  async getProfessionalRolesByFirmId(firmId: number): Promise<ProfessionalRole[]> {
    return Array.from(this.professionalRoles.values())
      .filter(role => role.firmId === firmId);
  }

  async createProfessionalRole(roleData: InsertProfessionalRole): Promise<ProfessionalRole> {
    const id = this.professionalRoleIdCounter++;
    const role: ProfessionalRole = {
      ...roleData,
      id,
      createdAt: new Date(),
      isActive: roleData.isActive ?? true
    };
    this.professionalRoles.set(id, role);
    return role;
  }

  async updateProfessionalRole(id: number, data: Partial<ProfessionalRole>): Promise<ProfessionalRole | undefined> {
    const role = this.professionalRoles.get(id);
    if (!role) return undefined;
    
    const updatedRole = { ...role, ...data };
    this.professionalRoles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteProfessionalRole(id: number): Promise<boolean> {
    return this.professionalRoles.delete(id);
  }
  
  // Time estimate operations
  async getTimeEstimate(id: number): Promise<TimeEstimate | undefined> {
    return this.timeEstimates.get(id);
  }

  async getTimeEstimatesByFirmId(firmId: number, limit?: number): Promise<TimeEstimate[]> {
    const estimates = Array.from(this.timeEstimates.values())
      .filter((estimate) => estimate.firmId === firmId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? estimates.slice(0, limit) : estimates;
  }

  async getTimeEstimatesByAssignedUserId(userId: number, limit?: number): Promise<TimeEstimate[]> {
    const estimates = Array.from(this.timeEstimates.values())
      .filter((estimate) => estimate.assignedToId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? estimates.slice(0, limit) : estimates;
  }

  async getTimeEstimatesByClientCompanyId(clientCompanyId: number): Promise<TimeEstimate[]> {
    return Array.from(this.timeEstimates.values())
      .filter((estimate) => estimate.clientCompanyId === clientCompanyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTimeEstimatesByProjectId(projectId: number): Promise<TimeEstimate[]> {
    return Array.from(this.timeEstimates.values())
      .filter((estimate) => estimate.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTimeEstimate(timeEstimateData: InsertTimeEstimate): Promise<TimeEstimate> {
    const id = this.timeEstimateIdCounter++;
    const timeEstimate: TimeEstimate = { 
      ...timeEstimateData, 
      id,
      createdAt: new Date(),
      status: timeEstimateData.status || 'planned',
      description: timeEstimateData.description || null,
      serviceId: timeEstimateData.serviceId || null,
      professionalRoleId: timeEstimateData.professionalRoleId || null,
      billable: timeEstimateData.billable ?? true,
      estimatedHours: timeEstimateData.estimatedHours || 0,
      estimatedCost: timeEstimateData.estimatedCost || null,
      actualHours: timeEstimateData.actualHours || null,
      actualCost: timeEstimateData.actualCost || null,
      startDate: timeEstimateData.startDate || null,
      endDate: timeEstimateData.endDate || null
    };
    this.timeEstimates.set(id, timeEstimate);
    return timeEstimate;
  }

  async updateTimeEstimate(id: number, data: Partial<TimeEstimate>): Promise<TimeEstimate | undefined> {
    const timeEstimate = this.timeEstimates.get(id);
    if (!timeEstimate) return undefined;
    
    const updatedTimeEstimate = { ...timeEstimate, ...data };
    this.timeEstimates.set(id, updatedTimeEstimate);
    return updatedTimeEstimate;
  }

  async deleteTimeEstimate(id: number): Promise<boolean> {
    return this.timeEstimates.delete(id);
  }
  
  // Hierarchical Time Analysis Methods
  
  /**
   * Time aggregation by client company
   * Groups and summarizes time estimates by client company
   */
  async getTimeAnalysisByClientCompany(firmId: number) {
    const clientCompanies = await this.getClientCompaniesByFirmId(firmId);
    const results = [];
    
    for (const company of clientCompanies) {
      const timeEstimates = await this.getTimeEstimatesByClientCompanyId(company.id);
      
      // Calculate aggregate statistics
      const totalEstimatedHours = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.estimatedHours?.toString() || '0') || 0), 0);
      
      const totalActualHours = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.actualHours?.toString() || '0') || 0), 0);
        
      const totalEstimatedCost = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.estimatedCost?.toString() || '0') || 0), 0);
        
      const totalActualCost = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.actualCost?.toString() || '0') || 0), 0);
      
      const billableHours = timeEstimates
        .filter(est => est.billable)
        .reduce((sum, est) => sum + (parseFloat(est.actualHours?.toString() || '0') || 0), 0);
      
      results.push({
        clientCompanyId: company.id,
        clientCompanyName: company.name,
        totalEstimatedHours,
        totalActualHours,
        totalEstimatedCost,
        totalActualCost,
        billableHours,
        estimateCount: timeEstimates.length,
        variance: totalActualHours - totalEstimatedHours,
        costVariance: totalActualCost - totalEstimatedCost,
        utilizationRate: totalEstimatedHours > 0 ? totalActualHours / totalEstimatedHours : 0,
        profitability: totalActualCost > 0 ? (totalEstimatedCost - totalActualCost) / totalEstimatedCost : 0
      });
    }
    
    return results;
  }
  
  /**
   * Time aggregation by project
   * Groups and summarizes time estimates by project
   */
  async getTimeAnalysisByProject(firmId: number) {
    const projects = await this.getProjectsByFirmId(firmId);
    const results = [];
    
    for (const project of projects) {
      const timeEstimates = await this.getTimeEstimatesByProjectId(project.id);
      
      // Calculate aggregate statistics
      const totalEstimatedHours = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.estimatedHours?.toString() || '0') || 0), 0);
      
      const totalActualHours = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.actualHours?.toString() || '0') || 0), 0);
        
      const totalEstimatedCost = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.estimatedCost?.toString() || '0') || 0), 0);
        
      const totalActualCost = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.actualCost?.toString() || '0') || 0), 0);
      
      // Get data about the client company for this project
      const clientCompany = await this.getClientCompany(project.clientCompanyId);
      
      results.push({
        projectId: project.id,
        projectName: project.name,
        clientCompanyId: project.clientCompanyId,
        clientCompanyName: clientCompany?.name || 'Unknown',
        totalEstimatedHours,
        totalActualHours,
        totalEstimatedCost,
        totalActualCost,
        estimateCount: timeEstimates.length,
        variance: totalActualHours - totalEstimatedHours,
        costVariance: totalActualCost - totalEstimatedCost,
        utilizationRate: totalEstimatedHours > 0 ? totalActualHours / totalEstimatedHours : 0,
        profitability: totalActualCost > 0 ? (totalEstimatedCost - totalActualCost) / totalEstimatedCost : 0,
        status: project.status
      });
    }
    
    return results;
  }
  
  /**
   * Time aggregation by staff (user)
   * Groups and summarizes time estimates by assigned staff member
   */
  async getTimeAnalysisByStaff(firmId: number) {
    // Get all user-firm relationships for this firm to identify staff
    const userFirmRelationships = await this.getUserFirmRelationshipsByFirmId(firmId);
    const results = [];
    
    for (const relationship of userFirmRelationships) {
      const user = await this.getUser(relationship.userId);
      if (!user) continue;
      
      const timeEstimates = await this.getTimeEstimatesByAssignedUserId(user.id);
      
      // Calculate aggregate statistics
      const totalEstimatedHours = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.estimatedHours?.toString() || '0') || 0), 0);
      
      const totalActualHours = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.actualHours?.toString() || '0') || 0), 0);
        
      const totalEstimatedCost = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.estimatedCost?.toString() || '0') || 0), 0);
        
      const totalActualCost = timeEstimates.reduce((sum, est) => 
        sum + (parseFloat(est.actualCost?.toString() || '0') || 0), 0);
      
      // Group by professional role
      const roleBreakdown: Record<string, {
        roleId: number;
        roleName: string;
        hours: number;
        cost: number;
      }> = {};
      
      for (const estimate of timeEstimates) {
        if (estimate.professionalRoleId) {
          const role = await this.getProfessionalRole(estimate.professionalRoleId);
          if (role) {
            if (!roleBreakdown[role.id]) {
              roleBreakdown[role.id] = {
                roleId: role.id,
                roleName: role.name,
                hours: 0,
                cost: 0
              };
            }
            
            const actualHours = parseFloat(estimate.actualHours?.toString() || '0') || 0;
            const actualCost = parseFloat(estimate.actualCost?.toString() || '0') || 0;
            
            roleBreakdown[role.id].hours += actualHours;
            roleBreakdown[role.id].cost += actualCost;
          }
        }
      }
      
      results.push({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: relationship.role,
        totalEstimatedHours,
        totalActualHours,
        totalEstimatedCost,
        totalActualCost,
        estimateCount: timeEstimates.length,
        variance: totalActualHours - totalEstimatedHours,
        utilizationRate: totalEstimatedHours > 0 ? totalActualHours / totalEstimatedHours : 0,
        roleBreakdown: Object.values(roleBreakdown)
      });
    }
    
    return results;
  }
  
  /**
   * Hierarchical rollup analysis by user (for owners with multiple firms)
   * Aggregates data across all firms where a user has ownership
   */
  async getHierarchicalRollupByUser(userId: number) {
    // Find all firms where the user has an ownership role
    const userFirmRelationships = await this.getUserFirmRelationshipsByUserId(userId);
    const ownedFirms = userFirmRelationships
      .filter(rel => rel.role === 'owner')
      .map(rel => rel.firmId);
    
    // Collect rollup data
    const firmSummaries = [];
    let totalBillableHours = 0;
    let totalEstimatedHours = 0;
    let totalActualHours = 0;
    let totalEstimatedCost = 0;
    let totalActualCost = 0;
    let totalClients = 0;
    let totalProjects = 0;
    
    for (const firmId of ownedFirms) {
      const firm = await this.getFirm(firmId);
      if (!firm) continue;
      
      // Get client-level data
      const clientAnalysis = await this.getTimeAnalysisByClientCompany(firmId);
      
      // Get project-level data
      const projectAnalysis = await this.getTimeAnalysisByProject(firmId);
      
      // Calculate firm-level metrics
      const firmBillableHours = clientAnalysis.reduce((sum, client) => sum + client.billableHours, 0);
      const firmEstimatedHours = clientAnalysis.reduce((sum, client) => sum + client.totalEstimatedHours, 0);
      const firmActualHours = clientAnalysis.reduce((sum, client) => sum + client.totalActualHours, 0);
      const firmEstimatedCost = clientAnalysis.reduce((sum, client) => sum + client.totalEstimatedCost, 0);
      const firmActualCost = clientAnalysis.reduce((sum, client) => sum + client.totalActualCost, 0);
      
      // Add to running totals
      totalBillableHours += firmBillableHours;
      totalEstimatedHours += firmEstimatedHours;
      totalActualHours += firmActualHours;
      totalEstimatedCost += firmEstimatedCost;
      totalActualCost += firmActualCost;
      totalClients += clientAnalysis.length;
      totalProjects += projectAnalysis.length;
      
      // Add firm summary
      firmSummaries.push({
        firmId: firm.id,
        firmName: firm.name,
        clientCount: clientAnalysis.length,
        projectCount: projectAnalysis.length,
        billableHours: firmBillableHours,
        estimatedHours: firmEstimatedHours,
        actualHours: firmActualHours,
        estimatedCost: firmEstimatedCost,
        actualCost: firmActualCost,
        profitability: firmActualCost > 0 ? (firmEstimatedCost - firmActualCost) / firmEstimatedCost : 0,
        clients: clientAnalysis,
        projects: projectAnalysis
      });
    }
    
    // Return the complete rollup data
    return {
      userId,
      firmCount: ownedFirms.length,
      totalClients,
      totalProjects,
      totalBillableHours,
      totalEstimatedHours,
      totalActualHours,
      totalEstimatedCost,
      totalActualCost,
      overallProfitability: totalActualCost > 0 ? (totalEstimatedCost - totalActualCost) / totalEstimatedCost : 0,
      firms: firmSummaries
    };
  }
  
  /**
   * Budget vs. Actual analysis for projects
   * Detailed comparison of estimated vs. actual time and costs
   */
  async getBudgetVsActualAnalysis(projectId: number) {
    const project = await this.getProject(projectId);
    if (!project) return null;
    
    const timeEstimates = await this.getTimeEstimatesByProjectId(projectId);
    const clientCompany = await this.getClientCompany(project.clientCompanyId);
    
    // Group by service
    const serviceBreakdown: Record<string, {
      serviceId: number | null;
      serviceName: string;
      estimatedHours: number;
      actualHours: number;
      estimatedCost: number;
      actualCost: number;
      hourVariance: number;
      costVariance: number;
      percentComplete: number;
    }> = {};
    
    for (const estimate of timeEstimates) {
      const serviceId = estimate.serviceId;
      let serviceName = 'Uncategorized';
      
      if (serviceId) {
        const service = await this.getService(serviceId);
        if (service) {
          serviceName = service.name;
        }
      }
      
      const key = serviceId?.toString() || 'null';
      if (!serviceBreakdown[key]) {
        serviceBreakdown[key] = {
          serviceId,
          serviceName,
          estimatedHours: 0,
          actualHours: 0,
          estimatedCost: 0,
          actualCost: 0,
          hourVariance: 0,
          costVariance: 0,
          percentComplete: 0
        };
      }
      
      const estimatedHours = parseFloat(estimate.estimatedHours?.toString() || '0') || 0;
      const actualHours = parseFloat(estimate.actualHours?.toString() || '0') || 0;
      const estimatedCost = parseFloat(estimate.estimatedCost?.toString() || '0') || 0;
      const actualCost = parseFloat(estimate.actualCost?.toString() || '0') || 0;
      
      serviceBreakdown[key].estimatedHours += estimatedHours;
      serviceBreakdown[key].actualHours += actualHours;
      serviceBreakdown[key].estimatedCost += estimatedCost;
      serviceBreakdown[key].actualCost += actualCost;
    }
    
    // Calculate variance and percent complete for each service
    for (const key in serviceBreakdown) {
      const service = serviceBreakdown[key];
      service.hourVariance = service.actualHours - service.estimatedHours;
      service.costVariance = service.actualCost - service.estimatedCost;
      service.percentComplete = service.estimatedHours > 0 ? 
        Math.min(100, (service.actualHours / service.estimatedHours) * 100) : 0;
    }
    
    // Group by professional role
    const roleBreakdown: Record<string, {
      roleId: number | null;
      roleName: string;
      estimatedHours: number;
      actualHours: number;
      estimatedCost: number;
      actualCost: number;
      hourVariance: number;
      costVariance: number;
    }> = {};
    
    for (const estimate of timeEstimates) {
      const roleId = estimate.professionalRoleId;
      let roleName = 'Unspecified';
      
      if (roleId) {
        const role = await this.getProfessionalRole(roleId);
        if (role) {
          roleName = role.name;
        }
      }
      
      const key = roleId?.toString() || 'null';
      if (!roleBreakdown[key]) {
        roleBreakdown[key] = {
          roleId,
          roleName,
          estimatedHours: 0,
          actualHours: 0,
          estimatedCost: 0,
          actualCost: 0,
          hourVariance: 0,
          costVariance: 0
        };
      }
      
      const estimatedHours = parseFloat(estimate.estimatedHours?.toString() || '0') || 0;
      const actualHours = parseFloat(estimate.actualHours?.toString() || '0') || 0;
      const estimatedCost = parseFloat(estimate.estimatedCost?.toString() || '0') || 0;
      const actualCost = parseFloat(estimate.actualCost?.toString() || '0') || 0;
      
      roleBreakdown[key].estimatedHours += estimatedHours;
      roleBreakdown[key].actualHours += actualHours;
      roleBreakdown[key].estimatedCost += estimatedCost;
      roleBreakdown[key].actualCost += actualCost;
    }
    
    // Calculate variance for each role
    for (const key in roleBreakdown) {
      const role = roleBreakdown[key];
      role.hourVariance = role.actualHours - role.estimatedHours;
      role.costVariance = role.actualCost - role.estimatedCost;
    }
    
    // Calculate totals
    const totalEstimatedHours = timeEstimates.reduce((sum, est) => 
      sum + (parseFloat(est.estimatedHours?.toString() || '0') || 0), 0);
    
    const totalActualHours = timeEstimates.reduce((sum, est) => 
      sum + (parseFloat(est.actualHours?.toString() || '0') || 0), 0);
      
    const totalEstimatedCost = timeEstimates.reduce((sum, est) => 
      sum + (parseFloat(est.estimatedCost?.toString() || '0') || 0), 0);
      
    const totalActualCost = timeEstimates.reduce((sum, est) => 
      sum + (parseFloat(est.actualCost?.toString() || '0') || 0), 0);
    
    return {
      projectId,
      projectName: project.name,
      clientCompanyId: project.clientCompanyId,
      clientCompanyName: clientCompany?.name || 'Unknown',
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      totalEstimatedHours,
      totalActualHours,
      totalEstimatedCost,
      totalActualCost,
      hourVariance: totalActualHours - totalEstimatedHours, 
      costVariance: totalActualCost - totalEstimatedCost,
      percentComplete: totalEstimatedHours > 0 ? Math.min(100, (totalActualHours / totalEstimatedHours) * 100) : 0,
      profitability: totalActualCost > 0 ? (totalEstimatedCost - totalActualCost) / totalEstimatedCost : 0,
      serviceBreakdown: Object.values(serviceBreakdown),
      roleBreakdown: Object.values(roleBreakdown)
    };
  }

  // Proposal operations
  async getProposal(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByFirmId(firmId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values())
      .filter((proposal) => proposal.firmId === firmId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProposalsByContactId(contactId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values())
      .filter((proposal) => proposal.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProposalsByClientCompanyId(clientCompanyId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values())
      .filter((proposal) => proposal.clientCompanyId === clientCompanyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createProposal(proposalData: InsertProposal): Promise<Proposal> {
    const id = this.proposalIdCounter++;
    const proposal: Proposal = { ...proposalData, id, createdAt: new Date() };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposal(id: number, data: Partial<Proposal>): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;
    
    const updatedProposal = { ...proposal, ...data };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  async deleteProposal(id: number): Promise<boolean> {
    return this.proposals.delete(id);
  }

  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getResourcesByAccessLevel(accessLevel: string): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.accessLevel === accessLevel)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createResource(resourceData: InsertResource): Promise<Resource> {
    const id = this.resourceIdCounter++;
    const resource: Resource = { ...resourceData, id, createdAt: new Date() };
    this.resources.set(id, resource);
    return resource;
  }

  async updateResource(id: number, data: Partial<Resource>): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const updatedResource = { ...resource, ...data };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }

  // Classification operations
  async getClassification(id: number): Promise<Classification | undefined> {
    return this.classifications.get(id);
  }

  async getAllClassifications(): Promise<Classification[]> {
    return Array.from(this.classifications.values());
  }

  async getClassificationsByCategory(category: string): Promise<Classification[]> {
    return Array.from(this.classifications.values())
      .filter((classification) => classification.category === category);
  }

  async getClassificationsByAccessLevel(accessLevel: string): Promise<Classification[]> {
    return Array.from(this.classifications.values())
      .filter((classification) => classification.accessLevel === accessLevel);
  }

  async createClassification(classificationData: InsertClassification): Promise<Classification> {
    const id = this.classificationIdCounter++;
    const classification: Classification = { ...classificationData, id };
    this.classifications.set(id, classification);
    return classification;
  }

  async updateClassification(id: number, data: Partial<Classification>): Promise<Classification | undefined> {
    const classification = this.classifications.get(id);
    if (!classification) return undefined;
    
    const updatedClassification = { ...classification, ...data };
    this.classifications.set(id, updatedClassification);
    return updatedClassification;
  }

  async deleteClassification(id: number): Promise<boolean> {
    return this.classifications.delete(id);
  }

  // Deadline operations
  async getDeadline(id: number): Promise<Deadline | undefined> {
    return this.deadlines.get(id);
  }

  async getDeadlinesByFirmId(firmId: number): Promise<Deadline[]> {
    return Array.from(this.deadlines.values())
      .filter((deadline) => deadline.firmId === firmId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async getDeadlinesByContactId(contactId: number): Promise<Deadline[]> {
    return Array.from(this.deadlines.values())
      .filter((deadline) => deadline.contactId === contactId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async getDeadlinesByClientCompanyId(clientCompanyId: number): Promise<Deadline[]> {
    return Array.from(this.deadlines.values())
      .filter((deadline) => deadline.clientCompanyId === clientCompanyId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async getUpcomingDeadlinesByFirmId(firmId: number, limit?: number): Promise<Deadline[]> {
    const now = new Date();
    const deadlines = Array.from(this.deadlines.values())
      .filter((deadline) => deadline.firmId === firmId && new Date(deadline.dueDate) >= now && !deadline.isCompleted)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    return limit ? deadlines.slice(0, limit) : deadlines;
  }

  async createDeadline(deadlineData: InsertDeadline): Promise<Deadline> {
    const id = this.deadlineIdCounter++;
    const deadline: Deadline = { ...deadlineData, id };
    this.deadlines.set(id, deadline);
    return deadline;
  }

  async updateDeadline(id: number, data: Partial<Deadline>): Promise<Deadline | undefined> {
    const deadline = this.deadlines.get(id);
    if (!deadline) return undefined;
    
    const updatedDeadline = { ...deadline, ...data };
    this.deadlines.set(id, updatedDeadline);
    return updatedDeadline;
  }

  async deleteDeadline(id: number): Promise<boolean> {
    return this.deadlines.delete(id);
  }
}

// Use DatabaseStorage instead of MemStorage to connect to PostgreSQL database
// Use MemStorage instead of DatabaseStorage to avoid database issues
export const storage = new MemStorage();
