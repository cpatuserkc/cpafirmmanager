import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertClientCompanySchema,
  insertProjectSchema,
  insertTimeEstimateSchema,
  insertProposalSchema,
  insertDeadlineSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler middleware for zod validation errors
  const validateBody = (schema: z.ZodType<any>) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          res.status(400).json({ message: validationError.message });
        } else {
          res.status(500).json({ message: "Internal server error" });
        }
      }
    };
  };

  // AUTH ROUTES
  app.post("/api/auth/register", validateBody(insertUserSchema), async (req, res) => {
    try {
      const { username, email } = req.body;
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(req.body);
      // Don't return password in response
      const { password, ...userData } = user;
      res.status(201).json(userData);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Don't return password in response
      const { password: _, ...userData } = user;
      res.status(200).json(userData);
    } catch (error) {
      res.status(500).json({ message: "Error logging in" });
    }
  });

  // CLIENT ROUTES
  app.get("/api/clients", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const clients = await storage.getClientsByUserId(userId);
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(200).json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  app.post("/api/clients", validateBody(insertClientCompanySchema), async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Error creating client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedClient = await storage.updateClient(id, req.body);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(200).json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Error updating client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting client" });
    }
  });

  // PROJECT ROUTES
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      
      let projects;
      if (clientId) {
        projects = await storage.getProjectsByClientId(clientId);
      } else if (userId) {
        projects = await storage.getProjectsByUserId(userId);
      } else {
        return res.status(400).json({ message: "User ID or Client ID is required" });
      }
      
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(200).json(project);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project" });
    }
  });

  app.post("/api/projects", validateBody(insertProjectSchema), async (req, res) => {
    try {
      const project = await storage.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Error creating project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedProject = await storage.updateProject(id, req.body);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(200).json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Error updating project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting project" });
    }
  });

  // TIME ESTIMATE ROUTES
  app.get("/api/time-estimates", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      let timeEstimates;
      if (projectId) {
        timeEstimates = await storage.getTimeEstimatesByProjectId(projectId);
      } else if (clientId) {
        timeEstimates = await storage.getTimeEstimatesByClientCompanyId(clientId);
      } else if (userId) {
        timeEstimates = await storage.getTimeEstimatesByAssignedUserId(userId, limit);
      } else {
        return res.status(400).json({ message: "User ID, Client ID, or Project ID is required" });
      }
      
      res.status(200).json(timeEstimates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching time estimates" });
    }
  });

  app.get("/api/time-estimates/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const timeEstimate = await storage.getTimeEstimate(id);
      
      if (!timeEstimate) {
        return res.status(404).json({ message: "Time estimate not found" });
      }
      
      res.status(200).json(timeEstimate);
    } catch (error) {
      res.status(500).json({ message: "Error fetching time estimate" });
    }
  });

  app.post("/api/time-estimates", validateBody(insertTimeEstimateSchema), async (req, res) => {
    try {
      const timeEstimate = await storage.createTimeEstimate(req.body);
      res.status(201).json(timeEstimate);
    } catch (error) {
      res.status(500).json({ message: "Error creating time estimate" });
    }
  });

  app.put("/api/time-estimates/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedTimeEstimate = await storage.updateTimeEstimate(id, req.body);
      
      if (!updatedTimeEstimate) {
        return res.status(404).json({ message: "Time estimate not found" });
      }
      
      res.status(200).json(updatedTimeEstimate);
    } catch (error) {
      res.status(500).json({ message: "Error updating time estimate" });
    }
  });

  app.delete("/api/time-estimates/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteTimeEstimate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Time estimate not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting time estimate" });
    }
  });

  // PROPOSAL ROUTES
  app.get("/api/proposals", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      
      let proposals;
      if (clientId) {
        proposals = await storage.getProposalsByClientId(clientId);
      } else if (userId) {
        proposals = await storage.getProposalsByUserId(userId);
      } else {
        return res.status(400).json({ message: "User ID or Client ID is required" });
      }
      
      res.status(200).json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching proposals" });
    }
  });

  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const proposal = await storage.getProposal(id);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      res.status(200).json(proposal);
    } catch (error) {
      res.status(500).json({ message: "Error fetching proposal" });
    }
  });

  app.post("/api/proposals", validateBody(insertProposalSchema), async (req, res) => {
    try {
      const proposal = await storage.createProposal(req.body);
      res.status(201).json(proposal);
    } catch (error) {
      res.status(500).json({ message: "Error creating proposal" });
    }
  });

  app.put("/api/proposals/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedProposal = await storage.updateProposal(id, req.body);
      
      if (!updatedProposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      res.status(200).json(updatedProposal);
    } catch (error) {
      res.status(500).json({ message: "Error updating proposal" });
    }
  });

  app.delete("/api/proposals/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteProposal(id);
      
      if (!success) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting proposal" });
    }
  });

  // EXTERNAL PROPOSAL REQUEST ENDPOINT
  // This endpoint receives proposal requests from external sites
  app.post("/api/external/proposal-requests", async (req, res) => {
    try {
      const requestData = req.body;
      
      // Make sure required data is present
      if (!requestData.clientName || !requestData.contactEmail) {
        return res.status(400).json({ error: "Missing required client information" });
      }
      
      // Create a temporary client company if it doesn't exist
      let clientCompanyId = null;
      let contactId = null;
      
      if (requestData.clientName) {
        // Default to admin/marketing firm ID of 1
        const marketingFirmId = 1;
        
        // Check for existing client company
        const clientCompanies = await storage.getClientCompaniesByFirmId(marketingFirmId);
        const existingCompany = clientCompanies.find((c: any) => 
          c.name.toLowerCase() === requestData.clientName.toLowerCase()
        );
        
        if (existingCompany) {
          clientCompanyId = existingCompany.id;
        } else {
          // Create new client company
          const newCompany = await storage.createClientCompany({
            firmId: marketingFirmId,
            name: requestData.clientName,
            website: requestData.website || null,
            industry: requestData.industry || null,
            address: requestData.address || null,
            city: requestData.city || null,
            state: requestData.state || null,
            zipCode: requestData.zipCode || null,
            country: 'USA',
            notes: 'Auto-created from external proposal request',
            isActive: true,
            primaryContactId: null
          });
          clientCompanyId = newCompany.id;
          
          // Create a contact record
          if (requestData.contactName && requestData.contactEmail) {
            const newContact = await storage.createContact({
              firmId: marketingFirmId,
              firstName: requestData.contactName.split(' ')[0] || requestData.contactName,
              lastName: requestData.contactName.split(' ').slice(1).join(' ') || '',
              email: requestData.contactEmail,
              phone: requestData.contactPhone || null,
              title: requestData.contactTitle || null,
              clientCompanyId: clientCompanyId,
              notes: 'Auto-created from external proposal request',
              isActive: true
            });
            contactId = newContact.id;
            
            // Update company with primary contact
            await storage.updateClientCompany(clientCompanyId, {
              primaryContactId: contactId
            });
          }
        }
      }
      
      // Create proposal with external source tag
      const proposalData = {
        firmId: 1, // Default admin/marketing firm
        createdById: 1, // Default admin user
        clientCompanyId,
        contactId,
        title: `New request from ${requestData.clientName}`,
        content: requestData.message || 'External proposal request',
        estimatedHours: 0,
        estimatedCost: 0,
        status: 'pending_assignment',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        estimatedStartDate: null,
        estimatedEndDate: null,
        source: 'external',
        requestDetails: requestData // Store all request details for reference
      };
      
      const proposal = await storage.createProposal(proposalData);
      
      // In a real system, we'd notify admins here about the new request
      // via email, SMS, or in-app notification
      
      return res.status(201).json({ 
        success: true, 
        message: "Your proposal request has been received. A CPA will contact you shortly.",
        requestId: proposal.id
      });
    } catch (error) {
      console.error("Error processing external proposal request:", error);
      return res.status(500).json({ error: "Failed to process your request" });
    }
  });

  // RESOURCES ROUTES
  app.get("/api/resources", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const accessLevel = req.query.accessLevel as string | undefined;
      
      let resources;
      if (type) {
        resources = await storage.getResourcesByType(type);
      } else if (accessLevel) {
        resources = await storage.getResourcesByAccessLevel(accessLevel);
      } else {
        resources = await storage.getAllResources();
      }
      
      res.status(200).json(resources);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resources" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const resource = await storage.getResource(id);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      res.status(200).json(resource);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resource" });
    }
  });

  // CLASSIFICATIONS ROUTES
  app.get("/api/classifications", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const accessLevel = req.query.accessLevel as string | undefined;
      
      let classifications;
      if (category) {
        classifications = await storage.getClassificationsByCategory(category);
      } else if (accessLevel) {
        classifications = await storage.getClassificationsByAccessLevel(accessLevel);
      } else {
        classifications = await storage.getAllClassifications();
      }
      
      res.status(200).json(classifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching classifications" });
    }
  });

  app.get("/api/classifications/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const classification = await storage.getClassification(id);
      
      if (!classification) {
        return res.status(404).json({ message: "Classification not found" });
      }
      
      res.status(200).json(classification);
    } catch (error) {
      res.status(500).json({ message: "Error fetching classification" });
    }
  });

  // PROFESSIONAL ROLES ROUTES
  app.get("/api/professional-roles", async (req, res) => {
    try {
      const firmId = req.query.firmId ? Number(req.query.firmId) : undefined;
      
      let roles;
      if (firmId) {
        roles = await storage.getProfessionalRolesByFirmId(firmId);
      } else {
        // Get all roles
        roles = [];
        // Get user's firms and then all roles for those firms
        const userId = req.session.userId;
        if (userId) {
          const relationships = await storage.getUserFirmRelationshipsByUserId(userId);
          const firmIds = relationships.map(rel => rel.firmId);
          
          // Get roles for all firms the user is associated with
          for (const id of firmIds) {
            const firmRoles = await storage.getProfessionalRolesByFirmId(id);
            roles.push(...firmRoles);
          }
        }
      }
      
      res.status(200).json(roles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching professional roles" });
    }
  });
  
  app.get("/api/professional-roles/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const role = await storage.getProfessionalRole(id);
      
      if (!role) {
        return res.status(404).json({ message: "Professional role not found" });
      }
      
      res.status(200).json(role);
    } catch (error) {
      res.status(500).json({ message: "Error fetching professional role" });
    }
  });
  
  // SERVICES ROUTES
  app.get("/api/services", async (req, res) => {
    try {
      const firmId = req.query.firmId ? Number(req.query.firmId) : undefined;
      const category = req.query.category as string | undefined;
      
      let services;
      if (firmId && category) {
        services = await storage.getServicesByCategory(firmId, category);
      } else if (firmId) {
        services = await storage.getServicesByFirmId(firmId);
      } else {
        // Get all services
        services = [];
        // Get user's firms and then all services for those firms
        const userId = req.session.userId;
        if (userId) {
          const relationships = await storage.getUserFirmRelationshipsByUserId(userId);
          const firmIds = relationships.map(rel => rel.firmId);
          
          // Get services for all firms the user is associated with
          for (const id of firmIds) {
            const firmServices = await storage.getServicesByFirmId(id);
            services.push(...firmServices);
          }
        }
      }
      
      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services" });
    }
  });
  
  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.status(200).json(service);
    } catch (error) {
      res.status(500).json({ message: "Error fetching service" });
    }
  });
  
  // SEASON PLANNER ROUTES
  app.get("/api/season-planner", async (req, res) => {
    try {
      const firmId = req.query.firmId ? Number(req.query.firmId) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const roleIds = req.query.roleIds ? 
        Array.isArray(req.query.roleIds) 
          ? (req.query.roleIds as string[]).map(id => Number(id))
          : [Number(req.query.roleIds)] 
        : [];
      const categories = req.query.categories ? 
        Array.isArray(req.query.categories) 
          ? req.query.categories as string[]
          : [req.query.categories as string] 
        : [];
      const includeProposals = req.query.includeProposals === 'true';
      const includeProjects = req.query.includeProjects === 'true';
      const includeDeadlines = req.query.includeDeadlines === 'true';
      
      if (!firmId) {
        return res.status(400).json({ message: "Firm ID is required" });
      }
      
      // Get projects for the date range and filters
      let projects = [];
      if (includeProjects) {
        projects = await storage.getProjectsByFirmId(firmId);
        
        // Apply date filter if provided
        if (startDate && endDate) {
          projects = projects.filter(project => {
            if (!project.startDate) return false;
            
            const projectStart = new Date(project.startDate);
            const projectEnd = project.endDate ? new Date(project.endDate) : projectStart;
            
            return (projectStart <= endDate && projectEnd >= startDate);
          });
        }
        
        // Apply role filter if provided
        if (roleIds.length > 0) {
          projects = projects.filter(project => 
            project.professionalRoleId && roleIds.includes(project.professionalRoleId)
          );
        }
        
        // Apply service category filter if provided
        if (categories.length > 0) {
          // First, get all services in the requested categories
          const services = await Promise.all(
            categories.map(category => storage.getServicesByCategory(firmId, category))
          );
          const serviceIds = services.flat().map(service => service.id);
          
          projects = projects.filter(project => 
            project.serviceId && serviceIds.includes(project.serviceId)
          );
        }
        
        // Enrich projects with client and service information
        const enrichedProjects = await Promise.all(
          projects.map(async (project) => {
            const clientCompany = project.clientCompanyId ? 
              await storage.getClientCompany(project.clientCompanyId) : null;
            
            const service = project.serviceId ? 
              await storage.getService(project.serviceId) : null;
            
            return {
              ...project,
              clientCompanyName: clientCompany?.name || 'Unknown Client',
              serviceName: service?.name || 'Unknown Service',
              serviceCategory: service?.category || 'Uncategorized'
            };
          })
        );
        
        projects = enrichedProjects;
      }
      
      // Get proposals for the date range and filters
      let proposals = [];
      if (includeProposals) {
        proposals = await storage.getProposalsByFirmId(firmId);
        
        // Apply date filter if provided
        if (startDate && endDate) {
          proposals = proposals.filter(proposal => {
            // For proposals, we'll check the estimated start/end dates if available
            // or the creation date if not
            const proposalStart = proposal.estimatedStartDate ? 
              new Date(proposal.estimatedStartDate) : 
              new Date(proposal.createdAt);
            
            const proposalEnd = proposal.estimatedEndDate ? 
              new Date(proposal.estimatedEndDate) : 
              proposal.expiryDate ? 
                new Date(proposal.expiryDate) : 
                proposalStart;
            
            return (proposalStart <= endDate && proposalEnd >= startDate);
          });
        }
        
        // Apply role filter if provided
        if (roleIds.length > 0) {
          // For proposals, we need to check the related proposal services
          const filteredProposals = [];
          
          for (const proposal of proposals) {
            const proposalServices = await storage.getProposalServicesByProposalId(proposal.id);
            
            // Check if any of the proposal services have matching role IDs
            const hasMatchingRole = proposalServices.some(ps => 
              ps.professionalRoleId && roleIds.includes(ps.professionalRoleId)
            );
            
            if (hasMatchingRole) {
              filteredProposals.push(proposal);
            }
          }
          
          proposals = filteredProposals;
        }
        
        // Apply service category filter if provided
        if (categories.length > 0) {
          // First, get all services in the requested categories
          const services = await Promise.all(
            categories.map(category => storage.getServicesByCategory(firmId, category))
          );
          const serviceIds = services.flat().map(service => service.id);
          
          // For proposals, we need to check the related proposal services
          const filteredProposals = [];
          
          for (const proposal of proposals) {
            const proposalServices = await storage.getProposalServicesByProposalId(proposal.id);
            
            // Check if any of the proposal services have matching service IDs
            const hasMatchingService = proposalServices.some(ps => 
              ps.serviceId && serviceIds.includes(ps.serviceId)
            );
            
            if (hasMatchingService) {
              filteredProposals.push(proposal);
            }
          }
          
          proposals = filteredProposals;
        }
        
        // Enrich proposals with client information
        const enrichedProposals = await Promise.all(
          proposals.map(async (proposal) => {
            const clientCompany = proposal.clientCompanyId ? 
              await storage.getClientCompany(proposal.clientCompanyId) : null;
            
            const contact = proposal.contactId ? 
              await storage.getContact(proposal.contactId) : null;
            
            // Get the proposal services for this proposal to calculate total hours and get service info
            const proposalServices = await storage.getProposalServicesByProposalId(proposal.id);
            
            // Calculate estimated hours (sum of all proposal services)
            const estimatedHours = proposalServices.reduce((total, ps) => {
              return total + (parseFloat(ps.estimatedHours || '0') || 0);
            }, 0);
            
            // Get main service category if available
            let mainServiceCategory = 'Uncategorized';
            if (proposalServices.length > 0 && proposalServices[0].serviceId) {
              const service = await storage.getService(proposalServices[0].serviceId);
              mainServiceCategory = service?.category || 'Uncategorized';
            }
            
            return {
              ...proposal,
              clientCompanyName: clientCompany?.name || 'Unknown Client',
              contactName: contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact',
              estimatedHours: estimatedHours.toString(),
              serviceCategory: mainServiceCategory
            };
          })
        );
        
        proposals = enrichedProposals;
      }
      
      // Get deadlines for the date range
      let deadlines = [];
      if (includeDeadlines) {
        deadlines = await storage.getDeadlinesByFirmId(firmId);
        
        // Apply date filter
        if (startDate && endDate) {
          deadlines = deadlines.filter(deadline => {
            const deadlineDate = new Date(deadline.dueDate);
            return (deadlineDate >= startDate && deadlineDate <= endDate);
          });
        }
        
        // Enrich deadlines with client information
        const enrichedDeadlines = await Promise.all(
          deadlines.map(async (deadline) => {
            const clientCompany = deadline.clientCompanyId ? 
              await storage.getClientCompany(deadline.clientCompanyId) : null;
            
            const contact = deadline.contactId ? 
              await storage.getContact(deadline.contactId) : null;
            
            return {
              ...deadline,
              clientCompanyName: clientCompany?.name || null,
              contactName: contact ? `${contact.firstName} ${contact.lastName}` : null
            };
          })
        );
        
        deadlines = enrichedDeadlines;
      }
      
      // Generate optimization suggestions based on the data
      const suggestions = generateOptimizationSuggestions(projects, proposals, deadlines);
      
      res.status(200).json({
        projects,
        proposals,
        deadlines,
        suggestions
      });
    } catch (error) {
      console.error('Season planner error:', error);
      res.status(500).json({ message: "Error fetching season planner data" });
    }
  });
  
  // Helper function to generate optimization suggestions
  function generateOptimizationSuggestions(projects: any[], proposals: any[], deadlines: any[]) {
    const suggestions = [];
    
    // Check for overallocation of projects
    const totalProjectHours = projects.reduce((sum, project) => 
      sum + (parseFloat(project.estimatedHours || '0') || 0), 0);
    
    if (totalProjectHours > 1000) { // Arbitrary threshold for demonstration
      suggestions.push({
        title: "High Project Load",
        description: "Current project load exceeds typical capacity. Consider redistributing work or extending timelines.",
        actionable: true
      });
    }
    
    // Check for underutilization
    if (totalProjectHours < 100 && proposals.length > 0) { // Arbitrary threshold for demonstration
      suggestions.push({
        title: "Low Utilization",
        description: "Current project load is below optimal utilization. Consider converting more proposals to active projects.",
        actionable: true
      });
    }
    
    // Check for impending deadlines
    const upcomingDeadlines = deadlines.filter(deadline => 
      !deadline.isCompleted && 
      new Date(deadline.dueDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 // Within 7 days
    );
    
    if (upcomingDeadlines.length > 0) {
      suggestions.push({
        title: "Impending Deadlines",
        description: `${upcomingDeadlines.length} deadlines are approaching within 7 days. Prioritize resources accordingly.`,
        actionable: true
      });
    }
    
    // Check for high-value proposals
    const highValueProposals = proposals.filter(proposal => 
      parseFloat(proposal.estimatedCost || '0') > 10000 // Arbitrary threshold for demonstration
    );
    
    if (highValueProposals.length > 0) {
      suggestions.push({
        title: "High-Value Proposals",
        description: `${highValueProposals.length} high-value proposals await conversion. Consider prioritizing follow-up.`,
        actionable: true
      });
    }
    
    return suggestions;
  }
  
  app.post("/api/season-planner/generate", async (req, res) => {
    try {
      const { firmId, startDate, endDate } = req.body;
      
      if (!firmId || !startDate || !endDate) {
        return res.status(400).json({ 
          message: "Missing required parameters: firmId, startDate, and endDate are required" 
        });
      }
      
      // In a real implementation, this would run optimization algorithms
      // to generate an optimal schedule based on constraints
      
      // For now, we'll create a simple response indicating success
      res.status(200).json({
        message: "Season plan generated successfully",
        planId: Date.now(), // placeholder for a real plan ID
        summary: {
          projectsScheduled: 10,
          hoursAllocated: 1200,
          utilizationRate: "85%",
          revenueProjection: "$120,000"
        }
      });
    } catch (error) {
      console.error('Generate plan error:', error);
      res.status(500).json({ message: "Error generating season plan" });
    }
  });
  
  app.post("/api/pricing/adjust", async (req, res) => {
    try {
      const { 
        firmId, 
        adjustmentPercent, 
        startDate, 
        endDate, 
        serviceCategories, 
        professionalRoleIds 
      } = req.body;
      
      if (!firmId || adjustmentPercent === undefined) {
        return res.status(400).json({ 
          message: "Missing required parameters: firmId and adjustmentPercent are required" 
        });
      }
      
      // Get the relevant professional roles
      let roles;
      if (professionalRoleIds && professionalRoleIds.length > 0) {
        roles = await Promise.all(
          professionalRoleIds.map(id => storage.getProfessionalRole(id))
        );
        // Filter out undefined roles
        roles = roles.filter(Boolean);
      } else {
        roles = await storage.getProfessionalRolesByFirmId(firmId);
      }
      
      // Filter roles by service category if specified
      if (serviceCategories && serviceCategories.length > 0) {
        // Get all services in the specified categories
        const services = await Promise.all(
          serviceCategories.map(category => storage.getServicesByCategory(firmId, category))
        );
        
        // Extract unique service IDs
        const serviceIds = [...new Set(services.flat().map(service => service.id))];
        
        // Get time estimates that use these services
        const timeEstimates = (await storage.getTimeEstimatesByFirmId(firmId))
          .filter(te => te.serviceId && serviceIds.includes(te.serviceId));
        
        // Extract unique professional role IDs from these time estimates
        const roleIds = [...new Set(
          timeEstimates
            .filter(te => te.professionalRoleId)
            .map(te => te.professionalRoleId)
        )];
        
        // Filter roles to only those referenced in the filtered time estimates
        roles = roles.filter(role => roleIds.includes(role.id));
      }
      
      // Apply the adjustment to each role
      const adjustedRoles = [];
      for (const role of roles) {
        // Calculate new rates based on adjustment percentage
        const adjustmentMultiplier = 1 + (adjustmentPercent / 100);
        
        const newTopTierRate = (parseFloat(role.topTierRate) * adjustmentMultiplier).toFixed(2);
        
        // Update the role with new rates
        const updatedRole = await storage.updateProfessionalRole(role.id, {
          ...role,
          topTierRate: newTopTierRate
        });
        
        if (updatedRole) {
          adjustedRoles.push(updatedRole);
        }
      }
      
      res.status(200).json({
        message: `Adjusted pricing by ${adjustmentPercent}% for ${adjustedRoles.length} professional roles`,
        adjustedRoles
      });
    } catch (error) {
      console.error('Price adjustment error:', error);
      res.status(500).json({ message: "Error adjusting pricing" });
    }
  });

  // DEADLINE ROUTES
  app.get("/api/deadlines", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      const upcoming = req.query.upcoming === 'true';
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      let deadlines;
      if (upcoming) {
        deadlines = await storage.getUpcomingDeadlinesByUserId(userId, limit);
      } else {
        deadlines = await storage.getDeadlinesByUserId(userId);
      }
      
      res.status(200).json(deadlines);
    } catch (error) {
      res.status(500).json({ message: "Error fetching deadlines" });
    }
  });

  app.get("/api/deadlines/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deadline = await storage.getDeadline(id);
      
      if (!deadline) {
        return res.status(404).json({ message: "Deadline not found" });
      }
      
      res.status(200).json(deadline);
    } catch (error) {
      res.status(500).json({ message: "Error fetching deadline" });
    }
  });

  app.post("/api/deadlines", validateBody(insertDeadlineSchema), async (req, res) => {
    try {
      const deadline = await storage.createDeadline(req.body);
      res.status(201).json(deadline);
    } catch (error) {
      res.status(500).json({ message: "Error creating deadline" });
    }
  });

  app.put("/api/deadlines/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedDeadline = await storage.updateDeadline(id, req.body);
      
      if (!updatedDeadline) {
        return res.status(404).json({ message: "Deadline not found" });
      }
      
      res.status(200).json(updatedDeadline);
    } catch (error) {
      res.status(500).json({ message: "Error updating deadline" });
    }
  });

  app.delete("/api/deadlines/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteDeadline(id);
      
      if (!success) {
        return res.status(404).json({ message: "Deadline not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting deadline" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
