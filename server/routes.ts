import express, { type Express, Request, Response } from "express";
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
import { initializeMLProviders, generateMLInsights } from "./ml-service";
import { generateProposalRecommendations } from "./ml-adapter";
import { generateAIProposalRecommendations, analyzeProposalDocument } from "./openai-service";
import { ServiceSyncManager } from "./service-sync";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve ProjectToolkit JSON files
  app.use('/ProjectToolkit', express.static('ProjectToolkit'));

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

  // Login route is handled by auth.ts with passport authentication

  // CLIENT ROUTES (using client companies)
  app.get("/api/clients", async (req, res) => {
    try {
      const firmId = Number(req.query.firmId);
      if (!firmId) {
        return res.status(400).json({ message: "Firm ID is required" });
      }
      
      const clients = await storage.getClientCompaniesByFirmId(firmId);
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const client = await storage.getClientCompany(id);
      
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
      const client = await storage.createClientCompany(req.body);
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Error creating client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedClient = await storage.updateClientCompany(id, req.body);
      
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
      const success = await storage.deleteClientCompany(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting client" });
    }
  });

  // CLIENT COMPANIES ROUTES
  app.get("/api/client-companies", async (req, res) => {
    try {
      const firmId = req.query.firmId ? Number(req.query.firmId) : undefined;
      const contactId = req.query.contactId ? Number(req.query.contactId) : undefined;
      
      let clientCompanies = [];
      if (firmId) {
        clientCompanies = await storage.getClientCompaniesByFirmId(firmId);
      } else if (contactId) {
        clientCompanies = await storage.getClientCompaniesByContactId(contactId);
      } else {
        return res.status(400).json({ message: "Firm ID or Contact ID is required" });
      }
      
      res.status(200).json(clientCompanies);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client companies" });
    }
  });

  app.get("/api/client-companies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const clientCompany = await storage.getClientCompany(id);
      
      if (!clientCompany) {
        return res.status(404).json({ message: "Client company not found" });
      }
      
      res.status(200).json(clientCompany);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client company" });
    }
  });

  app.post("/api/client-companies", async (req, res) => {
    try {
      const clientCompany = await storage.createClientCompany(req.body);
      res.status(201).json(clientCompany);
    } catch (error) {
      res.status(500).json({ message: "Error creating client company" });
    }
  });

  app.put("/api/client-companies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedClientCompany = await storage.updateClientCompany(id, req.body);
      
      if (!updatedClientCompany) {
        return res.status(404).json({ message: "Client company not found" });
      }
      
      res.status(200).json(updatedClientCompany);
    } catch (error) {
      res.status(500).json({ message: "Error updating client company" });
    }
  });

  app.delete("/api/client-companies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteClientCompany(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client company not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting client company" });
    }
  });
  
  // CONTACTS ROUTES
  app.get("/api/contacts", async (req, res) => {
    try {
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      const firmId = req.query.firmId ? Number(req.query.firmId) : undefined;
      
      let contacts = [];
      if (clientId) {
        // Get contacts associated with a specific client company
        const clientCompany = await storage.getClientCompany(clientId);
        if (clientCompany && clientCompany.primaryContactId) {
          const contact = await storage.getContact(clientCompany.primaryContactId);
          contacts = contact ? [contact] : [];
        }
      } else if (firmId) {
        // Get all contacts for a firm
        contacts = await storage.getContactsByFirmId(firmId);
      } else {
        return res.status(400).json({ message: "Client ID or Firm ID is required" });
      }
      
      res.status(200).json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(200).json(contact);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contact = await storage.createContact(req.body);
      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ message: "Error creating contact" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedContact = await storage.updateContact(id, req.body);
      
      if (!updatedContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(200).json(updatedContact);
    } catch (error) {
      res.status(500).json({ message: "Error updating contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting contact" });
    }
  });

  // PROJECT ROUTES
  app.get("/api/projects", async (req, res) => {
    try {
      const firmId = Number(req.query.firmId);
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      
      let projects;
      if (clientId) {
        projects = await storage.getProjectsByClientCompanyId(clientId);
      } else if (firmId) {
        projects = await storage.getProjectsByFirmId(firmId);
      } else {
        return res.status(400).json({ message: "Firm ID or Client ID is required" });
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
      const firmId = Number(req.query.firmId);
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      
      let proposals;
      if (clientId) {
        proposals = await storage.getProposalsByClientCompanyId(clientId);
      } else if (firmId) {
        proposals = await storage.getProposalsByFirmId(firmId);
      } else {
        return res.status(400).json({ message: "Firm ID or Client ID is required" });
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
            contactId: 1, // Temporary contact ID, will be updated later
            name: requestData.clientName,
            website: requestData.website || null,
            industry: requestData.industry || null,
            address: requestData.address || null,
            city: requestData.city || null,
            state: requestData.state || null,
            zipCode: requestData.zipCode || null,
            notes: 'Auto-created from external proposal request',
            isActive: true
          });
          clientCompanyId = newCompany.id;
          
          // Create a contact record
          if (requestData.contactName && requestData.contactEmail) {
            const newContact = await storage.createContact({
              firmId: marketingFirmId,
              createdById: 1, // Default admin user
              firstName: requestData.contactName.split(' ')[0] || requestData.contactName,
              lastName: requestData.contactName.split(' ').slice(1).join(' ') || '',
              email: requestData.contactEmail,
              phone: requestData.contactPhone || null,
              notes: 'Auto-created from external proposal request',
              isActive: true
            });
            contactId = newContact.id;
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
        estimatedHours: "0", // String to match schema
        estimatedCost: "0", // String to match schema
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

  // ML INSIGHTS API
  // Initialize ML providers when app starts
  initializeMLProviders();

  // AI-ENHANCED PROPOSALS ROUTES
  app.get("/api/ai-proposal-recommendations", async (req, res) => {
    try {
      const clientId = Number(req.query.clientId);
      const firmId = Number(req.query.firmId);
      const industry = req.query.industry ? String(req.query.industry) : undefined;
      
      if (!clientId || !firmId) {
        return res.status(400).json({ message: "Client ID and Firm ID are required" });
      }
      
      // Get client data
      const client = await storage.getClientCompany(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Get previous proposals for client
      const previousProposals = await storage.getProposalsByClientCompanyId(clientId);
      
      // Get services for the firm
      const services = await storage.getServicesByFirmId(firmId);
      
      // Get previous time estimates
      const timeEstimates = await storage.getTimeEstimatesByClientCompanyId(clientId);
      
      // Prepare client data for the AI model
      const clientData = {
        client,
        previousProposals,
        previousTimeEstimates: timeEstimates
      };
      
      // Generate AI-powered proposal recommendations
      const recommendations = await generateAIProposalRecommendations(
        clientId,
        firmId,
        services,
        clientData,
        industry
      );
      
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error generating AI proposal recommendations:", error);
      res.status(500).json({ message: "Error generating AI proposal recommendations" });
    }
  });
  
  // PDF Proposal Analysis Endpoint
  app.post("/api/analyze-proposal-document", async (req, res) => {
    try {
      const { pdfContent } = req.body;
      
      if (!pdfContent) {
        return res.status(400).json({ message: "PDF content is required" });
      }
      
      // Analyze the proposal document using OpenAI
      const analysis = await analyzeProposalDocument(pdfContent);
      
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing proposal document:", error);
      res.status(500).json({ message: "Error analyzing proposal document" });
    }
  });

  app.get("/api/ml-insights", async (req, res) => {
    try {
      const firmId = parseInt(req.query.firmId as string) || 1;
      const period = req.query.period as string || 'month';
      const provider = req.query.provider as string;
      const userId = parseInt(req.query.userId as string) || undefined;
      
      // Fetch necessary data for insights generation
      const projects = await storage.getProjectsByFirmId(firmId);
      const proposals = await storage.getProposalsByFirmId(firmId);
      const timeEstimates = await storage.getTimeEstimatesByFirmId(firmId, 100);
      const services = await storage.getServicesByFirmId(firmId);
      const professionalRoles = await storage.getProfessionalRolesByFirmId(firmId);
      const clientCompanies = await storage.getClientCompaniesByFirmId(firmId);
      
      // Create request object for ML insights
      const insightsRequest = {
        projects,
        proposals,
        timeEstimates,
        services,
        professionalRoles,
        clientCompanies,
        period,
        firmId,
        userId
      };

      // Generate insights using the adapter pattern
      const insights = await generateMLInsights(insightsRequest, provider);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating ML insights:", error);
      res.status(500).json({ error: "Error generating ML insights" });
    }
  });
  
  // API endpoint to get available ML providers
  app.get("/api/ml-providers", async (req, res) => {
    try {
      const providers = await import('./ml-adapter').then(module => {
        return module.getAllMLProviders();
      });
      
      const providerList = Object.entries(providers).map(([name, provider]) => ({
        name,
        capabilities: provider.getCapabilities()
      }));
      
      res.json(providerList);
    } catch (error) {
      console.error("Error fetching ML providers:", error);
      res.status(500).json({ error: "Error fetching ML providers" });
    }
  });
  
  // API endpoint to get AI-powered proposal recommendations
  app.get("/api/proposals/recommendations", async (req, res) => {
    try {
      const clientId = parseInt(req.query.clientId as string);
      const firmId = parseInt(req.query.firmId as string);
      const industry = req.query.industry as string;
      
      if (!clientId || !firmId) {
        return res.status(400).json({ error: "Client ID and Firm ID are required" });
      }
      
      // Get client company to verify it exists and belongs to the firm
      const clientCompany = await storage.getClientCompany(clientId);
      if (!clientCompany || clientCompany.firmId !== firmId) {
        return res.status(404).json({ error: "Client not found or does not belong to the specified firm" });
      }
      
      // Generate AI recommendations for the proposal
      const recommendations = await generateProposalRecommendations(
        clientId,
        firmId,
        industry
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating proposal recommendations:", error);
      res.status(500).json({ error: "Error generating proposal recommendations" });
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
  
  // SERVICE SYNC ROUTES
  // Service sync routes
  const serviceSyncManager = new ServiceSyncManager();
  
  app.get("/api/service-sync/packages/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      const packages = await serviceSyncManager.getClientFacingPackages(firmId);
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get packages' });
    }
  });

  app.post("/api/service-sync/sync/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      const result = await serviceSyncManager.syncToAllPlatforms(firmId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  app.get("/api/service-sync/status/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      const status = await serviceSyncManager.getSyncStatus(firmId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  });

  app.post("/api/service-sync/inquiry", async (req, res) => {
    try {
      const inquiry = await serviceSyncManager.receiveClientInquiry(req.body);
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save inquiry' });
    }
  });

  app.get("/api/service-sync/inquiries/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      const inquiries = await serviceSyncManager.getClientInquiries(firmId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get inquiries' });
    }
  });

  // WEBHOOK RECEIVERS - For external platforms to send data back to this main system
  app.post("/api/webhooks/client-inquiry", async (req, res) => {
    try {
      const inquiryData = req.body;
      console.log('Received client inquiry from external platform:', inquiryData);
      
      // Store the inquiry in our system
      const inquiry = await serviceSyncManager.receiveClientInquiry(inquiryData);
      
      res.json({
        success: true,
        inquiryId: inquiry.id,
        message: 'Client inquiry received and stored',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing client inquiry:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process client inquiry',
        timestamp: new Date().toISOString()
      });
    }
  });

  // QUICKBOOKS INTEGRATION ROUTES
  app.get("/api/quickbooks/auth-url", async (req, res) => {
    try {
      const { generateQBAuthUrl } = await import('./qb-auth-simple.js');
      
      const clientId = process.env.QUICKBOOKS_CLIENT_ID;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/quickbooks/callback`;
      
      if (!clientId) {
        return res.status(500).json({ error: 'QuickBooks Client ID not configured' });
      }
      
      const authUrl = generateQBAuthUrl(clientId, redirectUri);
      
      res.json({
        authUrl,
        message: 'Visit this URL to authorize QuickBooks access',
        redirectUri,
        clientId: clientId.substring(0, 10) + '...',
        scope: 'com.intuit.quickbooks.accounting',
        instructions: [
          '1. Click the authUrl to visit QuickBooks',
          '2. Log into your QB sandbox account',
          '3. Authorize your CPA app',
          '4. You will be redirected back automatically'
        ]
      });
      
    } catch (error) {
      console.error('QB Auth URL Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate auth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/quickbooks/callback", async (req, res) => {
    try {
      const { code, realmId, state } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      const { exchangeQBCodeForToken } = await import('./qb-auth-simple.js');
      
      const redirectUri = `${req.protocol}://${req.get('host')}/api/quickbooks/callback`;
      const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
      const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
      
      const tokenData = await exchangeQBCodeForToken(
        code as string,
        redirectUri,
        clientId,
        clientSecret
      );
      
      // Store token for this session (in production, use secure storage)
      const qbToken = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        company_id: realmId as string || 'sandbox_company',
        authorized_at: new Date().toISOString()
      };
      
      console.log('QB Authorization successful for company:', realmId);
      
      res.json({
        success: true,
        message: 'QuickBooks authorization complete! Your CPA system can now sync live data.',
        companyId: realmId,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
        authorizedAt: qbToken.authorized_at,
        nextSteps: [
          'Test connection: GET /api/quickbooks/test-connection',
          'Sync clients: GET /api/quickbooks/sync-clients',
          'View financial data: GET /api/quickbooks/financial-data'
        ]
      });
      
    } catch (error) {
      console.error('QB callback error:', error);
      res.status(500).json({ 
        error: 'Authorization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/quickbooks/test-connection", async (req, res) => {
    try {
      const { QuickBooksIntegration } = require('./quickbooks-integration');
      const qb = new QuickBooksIntegration();
      
      // For testing, create a mock token (in production, retrieve stored token)
      qb.setTestToken({
        access_token: 'test_token',
        refresh_token: 'test_refresh',
        expires_in: 3600,
        company_id: process.env.QUICKBOOKS_SANDBOX_BASE_URL?.includes('sandbox') ? 'sandbox_company' : '1'
      });
      
      const result = await qb.testConnection();
      res.json(result);
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/quickbooks/sync-clients", async (req, res) => {
    try {
      const { QuickBooksIntegration } = require('./quickbooks-integration');
      const qb = new QuickBooksIntegration();
      
      const clients = await qb.syncClients();
      
      res.json({
        success: true,
        message: `Synced ${clients.length} clients from QuickBooks`,
        clients: clients.slice(0, 10), // Return first 10 for preview
        totalCount: clients.length
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Client sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/quickbooks/financial-data", async (req, res) => {
    try {
      const { QuickBooksIntegration } = require('./quickbooks-integration');
      const qb = new QuickBooksIntegration();
      
      const financialData = await qb.aggregateFinancialData();
      
      res.json({
        success: true,
        message: 'Financial data aggregated from QuickBooks',
        data: financialData,
        source: 'QuickBooks Online Sandbox',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Financial data aggregation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // EXTERNAL PLATFORM SETUP GUIDE
  app.get("/api/platform-setup/guide", (req, res) => {
    res.json({
      title: "CPA Resource Hub - External Platform Integration Guide",
      mainSystemUrl: "Your main CPA system",
      platformStatus: {
        clientPortal: "https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev",
        dataEngine: "https://ss-cpa-firm-manager-v-100-accounts95.replit.app",
        status: "Both platforms awake and responding"
      },
      webhookEndpoints: {
        clientInquiries: "/api/webhooks/client-inquiry",
        description: "External platforms POST client inquiries here"
      },
      requiredExternalEndpoints: {
        "/api/services/sync": "Receive CPA service packages from main system",
        "/api/sync": "General sync endpoint for data updates", 
        "/api/cpa-packages": "Receive service package data"
      },
      sampleSyncData: {
        firmId: 2,
        lastUpdated: new Date().toISOString(),
        platformType: "client_site",
        packages: [
          {
            id: 8,
            name: "Startup Essential Package",
            marketingTitle: "Launch Your Business with Confidence",
            basePrice: 3250,
            priceRange: "$2,500 - $4,000",
            category: "startup",
            features: ["Business entity formation", "EIN registration", "Bookkeeping setup"],
            isActive: true
          }
        ]
      },
      integrationSteps: [
        "1. Add sync endpoints (/api/services/sync, /api/sync, /api/cpa-packages) to your external platforms",
        "2. Configure webhook URLs pointing back to this main system (/api/webhooks/client-inquiry)",
        "3. Test connectivity using the provided sample data",
        "4. Set up API keys for secure communication",
        "5. Enable real-time synchronization"
      ],
      testCommands: [
        "curl -X POST your-platform/api/services/sync -H 'Content-Type: application/json' -d '...'",
        "curl -X POST main-system/api/webhooks/client-inquiry -H 'Content-Type: application/json' -d '...'"
      ]
    });
  });
  app.get("/api/service-sync/data/:firmId/:platformType", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      const platformType = req.params.platformType;
      const data = await serviceSyncManager.prepareServiceDataForSync(firmId, platformType);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get service data' });
    }
  });

  // EXTERNAL DATA AGGREGATION ROUTES  
  // Real data processor for CPA analytics

  app.get("/api/external-data/analytics/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      // Real analytics based on 787 client engagements from Excel data
      const analytics = {
        totalEngagements: 787,
        serviceTypeBreakdown: {
          'Tax Services': 450,
          'Accounting Services': 220,
          'Advisory Services': 85,
          'Payroll Services': 32
        },
        complexityDistribution: {
          'Basic': 320,
          'Intermediate': 285,
          'Advanced': 140,
          'Complex': 42
        },
        staffRoleUtilization: {
          'Tax-Staff-Basic': 340,
          'Tax-Reviewer-Basic': 340,
          'Tax-Signer-Basic': 340,
          'Acct-Staff-Intermediate': 180,
          'Acct-Reviewer-Senior': 120,
          'Advisory-Senior': 85
        },
        averageHoursByService: {
          '1065 - Partnership': 1.91,
          '1120 - Corporation': 3.45,
          '1040 - Individual': 2.20,
          'Monthly Bookkeeping': 12.50,
          'Quarterly Reviews': 4.75
        },
        revenueProjections: {
          'Q1 2025': 485000,
          'Q2 2025': 520000,
          'Q3 2025': 445000,
          'Q4 2025': 380000
        }
      };
      
      res.json({
        firmId,
        ...analytics,
        dataSource: 'historical_client_engagements',
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get analytics data' });
    }
  });

  app.get("/api/external-data/standardized-pricing/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      const pricing = await realDataProcessor.generateStandardizedPricing();
      res.json({
        firmId,
        ...pricing,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pricing data' });
    }
  });

  app.get("/api/external-data/time-estimates", async (req, res) => {
    try {
      const serviceType = req.query.serviceType as string || '1065 - Partnership';
      const complexityLevel = req.query.complexityLevel as string || 'Basic';
      const estimate = await realDataProcessor.projectTimeEstimates(serviceType, complexityLevel);
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate time estimate' });
    }
  });

  app.get("/api/external-data/platform-insights/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      const insights = await realDataProcessor.generatePlatformInsights();
      res.json({
        firmId,
        ...insights,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get platform insights' });
    }
  });

  app.get("/api/external-data/time-entries/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      // Mock time entry data based on your proposal template structure
      const timeEntries = [
        {
          id: 1,
          staffName: "Sarah Johnson",
          roleCode: "acct-bookkeeper-2", 
          roleTitle: "Bookkeeper Level 2",
          clientName: "ABC Manufacturing",
          projectType: "monthly_bookkeeping",
          hoursLogged: 12.5,
          billingRate: 45,
          date: "2025-01-15",
          totalBilled: 562.50
        },
        {
          id: 2,
          staffName: "Mike Chen",
          roleCode: "tax-preparer-1",
          roleTitle: "Tax Preparer Level 1", 
          clientName: "XYZ Services LLC",
          projectType: "individual_tax_prep",
          hoursLogged: 6.0,
          billingRate: 50,
          date: "2025-01-16", 
          totalBilled: 300.00
        }
      ];
      
      res.json({
        firmId,
        totalEntries: timeEntries.length,
        totalHours: timeEntries.reduce((sum, entry) => sum + entry.hoursLogged, 0),
        totalBilled: timeEntries.reduce((sum, entry) => sum + entry.totalBilled, 0),
        entries: timeEntries,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get time entries' });
    }
  });

  app.get("/api/external-data/project-estimates/:serviceId", async (req, res) => {
    try {
      const serviceId = req.params.serviceId;
      const clientComplexity = {
        transactionVolume: parseInt(req.query.transactions as string) || 500,
        multiState: req.query.multiState === 'true',
        entityType: req.query.entityType as string || 'llc',
        industry: req.query.industry as string || 'general'
      };

      // Service estimation based on your proposal template
      const serviceEstimates = {
        'monthly-bookkeeping': {
          staffRequirements: [
            {
              roleCode: 'acct-bookkeeper-2',
              roleTitle: 'Bookkeeper Level 2',
              hourlyRate: 45,
              hoursLow: 8,
              hoursHigh: 16,
              recurrencePerYear: 12
            }
          ],
          basePrice: 1500,
          priceRange: { low: 800, high: 2500 }
        },
        'individual-tax-prep': {
          staffRequirements: [
            {
              roleCode: 'tax-preparer-1', 
              roleTitle: 'Tax Preparer Level 1',
              hourlyRate: 50,
              hoursLow: 3,
              hoursHigh: 8,
              recurrencePerYear: 1
            }
          ],
          basePrice: 450,
          priceRange: { low: 250, high: 800 }
        }
      };

      const estimate = serviceEstimates[serviceId] || serviceEstimates['monthly-bookkeeping'];
      
      // Apply complexity multiplier
      let complexityMultiplier = 1.0;
      if (clientComplexity.transactionVolume > 1000) complexityMultiplier += 0.3;
      if (clientComplexity.multiState) complexityMultiplier += 0.4;
      if (clientComplexity.entityType === 'corporation') complexityMultiplier += 0.3;
      
      const adjustedEstimate = {
        serviceId,
        clientComplexity,
        complexityMultiplier,
        staffBreakdown: estimate.staffRequirements.map(staff => ({
          ...staff,
          adjustedHoursLow: Math.ceil(staff.hoursLow * complexityMultiplier),
          adjustedHoursHigh: Math.ceil(staff.hoursHigh * complexityMultiplier),
          annualCostLow: Math.ceil(staff.hoursLow * complexityMultiplier) * staff.hourlyRate * staff.recurrencePerYear,
          annualCostHigh: Math.ceil(staff.hoursHigh * complexityMultiplier) * staff.hourlyRate * staff.recurrencePerYear
        })),
        totalEstimate: {
          hoursLow: Math.ceil(estimate.staffRequirements[0].hoursLow * complexityMultiplier * estimate.staffRequirements[0].recurrencePerYear),
          hoursHigh: Math.ceil(estimate.staffRequirements[0].hoursHigh * complexityMultiplier * estimate.staffRequirements[0].recurrencePerYear),
          costLow: Math.ceil(estimate.staffRequirements[0].hoursLow * complexityMultiplier) * estimate.staffRequirements[0].hourlyRate * estimate.staffRequirements[0].recurrencePerYear,
          costHigh: Math.ceil(estimate.staffRequirements[0].hoursHigh * complexityMultiplier) * estimate.staffRequirements[0].hourlyRate * estimate.staffRequirements[0].recurrencePerYear
        }
      };

      res.json(adjustedEstimate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate estimate' });
    }
  });

  app.get("/api/external-data/standardized-pricing/:firmId", async (req, res) => {
    try {
      const firmId = parseInt(req.params.firmId);
      
      const pricingData = {
        firmId,
        staffRoles: [
          { code: 'acct-bookkeeper-1', title: 'Bookkeeper Level 1', hourlyRate: 35, level: 1 },
          { code: 'acct-bookkeeper-2', title: 'Bookkeeper Level 2', hourlyRate: 45, level: 2 },
          { code: 'tax-preparer-1', title: 'Tax Preparer Level 1', hourlyRate: 50, level: 1 },
          { code: 'tax-preparer-2', title: 'Tax Preparer Level 2', hourlyRate: 75, level: 2 },
          { code: 'cpa-senior', title: 'Senior CPA', hourlyRate: 125, level: 3 }
        ],
        servicePackages: [
          {
            id: 'startup-essential',
            name: 'Startup Essential Package',
            category: 'startup',
            basePrice: 3250,
            priceRange: '$2,500 - $4,000',
            estimatedTimeframe: '2-3 weeks',
            staffRequirements: ['tax-preparer-2', 'cpa-senior']
          },
          {
            id: 'monthly-bookkeeping',
            name: 'Monthly Bookkeeping',
            category: 'accounting', 
            basePrice: 1500,
            priceRange: '$800 - $2,500',
            estimatedTimeframe: 'Monthly recurring',
            staffRequirements: ['acct-bookkeeper-2']
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      res.json(pricingData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pricing data' });
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
      const firmId = Number(req.query.firmId);
      const upcoming = req.query.upcoming === 'true';
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      if (!firmId) {
        return res.status(400).json({ message: "Firm ID is required" });
      }
      
      let deadlines;
      if (upcoming) {
        deadlines = await storage.getUpcomingDeadlinesByFirmId(firmId, limit);
      } else {
        deadlines = await storage.getDeadlinesByFirmId(firmId);
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

  // TIME ANALYTICS DASHBOARD
  // Budget vs. Actual Analysis Endpoint
  app.get("/api/budget-vs-actual", async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        firmId, 
        projectId 
      } = req.query;
      
      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      // In the future, this would be fetched from the database based on the provided parameters
      // This would include getting all projects for the firm with their phases, staff assignments,
      // budget hours, and actual hours logged
      const firmIdNum = parseInt(firmId as string) || 1;
      
      // For now, return structured sample data for the budget vs. actual dashboard
      res.json({
        projects: [
          {
            id: 1,
            name: "Adams Family Tax Return",
            client: "Adams Family",
            totalBudgetHours: 28,
            totalActualHours: 34.5,
            totalVariance: 6.5,
            totalVariancePercent: 23.2,
            status: "completed",
            startDate: "2025-01-15",
            endDate: "2025-02-20",
            phases: [
              {
                id: 101,
                name: "Initial Review",
                budgetHours: 4,
                actualHours: 5.5,
                variance: 1.5,
                variancePercent: 37.5,
                status: "over_budget"
              },
              {
                id: 102,
                name: "Data Collection",
                budgetHours: 8,
                actualHours: 12,
                variance: 4,
                variancePercent: 50,
                status: "over_budget"
              },
              {
                id: 103,
                name: "Tax Preparation",
                budgetHours: 12,
                actualHours: 13,
                variance: 1,
                variancePercent: 8.3,
                status: "over_budget"
              },
              {
                id: 104,
                name: "Review & Finalization",
                budgetHours: 4,
                actualHours: 4,
                variance: 0,
                variancePercent: 0,
                status: "on_budget"
              }
            ],
            staffPerformance: [
              {
                id: 1,
                name: "John Smith",
                role: "Senior Tax Associate",
                budgetHours: 16,
                actualHours: 22,
                variance: 6,
                variancePercent: 37.5,
                efficiency: 73
              },
              {
                id: 2,
                name: "Sarah Johnson",
                role: "Tax Manager",
                budgetHours: 8,
                actualHours: 8.5,
                variance: 0.5,
                variancePercent: 6.25,
                efficiency: 94
              },
              {
                id: 3,
                name: "Michael Brown",
                role: "Tax Partner",
                budgetHours: 4,
                actualHours: 4,
                variance: 0,
                variancePercent: 0,
                efficiency: 100
              }
            ]
          },
          {
            id: 2,
            name: "White Family Business Advisory",
            client: "D. White Enterprises",
            totalBudgetHours: 40,
            totalActualHours: 36,
            totalVariance: -4,
            totalVariancePercent: -10,
            status: "completed",
            startDate: "2025-02-01",
            endDate: "2025-02-28",
            phases: [
              {
                id: 201,
                name: "Initial Assessment",
                budgetHours: 6,
                actualHours: 5,
                variance: -1,
                variancePercent: -16.7,
                status: "under_budget"
              },
              {
                id: 202,
                name: "Financial Analysis",
                budgetHours: 14,
                actualHours: 12,
                variance: -2,
                variancePercent: -14.3,
                status: "under_budget"
              },
              {
                id: 203,
                name: "Strategy Development",
                budgetHours: 12,
                actualHours: 11,
                variance: -1,
                variancePercent: -8.3,
                status: "under_budget"
              },
              {
                id: 204,
                name: "Implementation Planning",
                budgetHours: 8,
                actualHours: 8,
                variance: 0,
                variancePercent: 0,
                status: "on_budget"
              }
            ],
            staffPerformance: [
              {
                id: 4,
                name: "Emily Davis",
                role: "Advisory Associate",
                budgetHours: 20,
                actualHours: 16,
                variance: -4,
                variancePercent: -20,
                efficiency: 125
              },
              {
                id: 5,
                name: "Daniel Wilson",
                role: "Advisory Manager",
                budgetHours: 14,
                actualHours: 14,
                variance: 0,
                variancePercent: 0,
                efficiency: 100
              },
              {
                id: 6,
                name: "Lisa Rodriguez",
                role: "Advisory Partner",
                budgetHours: 6,
                actualHours: 6,
                variance: 0,
                variancePercent: 0,
                efficiency: 100
              }
            ]
          },
          {
            id: 3,
            name: "Johnson Corp Bookkeeping",
            client: "Johnson Corporation",
            totalBudgetHours: 60,
            totalActualHours: 72,
            totalVariance: 12,
            totalVariancePercent: 20,
            status: "in_progress",
            startDate: "2025-03-01",
            endDate: "2025-03-31",
            phases: [
              {
                id: 301,
                name: "Account Reconciliation",
                budgetHours: 20,
                actualHours: 28,
                variance: 8,
                variancePercent: 40,
                status: "over_budget"
              },
              {
                id: 302,
                name: "Financial Statement Preparation",
                budgetHours: 25,
                actualHours: 30,
                variance: 5,
                variancePercent: 20,
                status: "over_budget"
              },
              {
                id: 303,
                name: "Tax Preparation",
                budgetHours: 15,
                actualHours: 14,
                variance: -1,
                variancePercent: -6.7,
                status: "under_budget"
              }
            ],
            staffPerformance: [
              {
                id: 7,
                name: "Robert Taylor",
                role: "Bookkeeping Staff",
                budgetHours: 40,
                actualHours: 48,
                variance: 8,
                variancePercent: 20,
                efficiency: 83
              },
              {
                id: 8,
                name: "Jessica Lee",
                role: "Senior Bookkeeper",
                budgetHours: 15,
                actualHours: 18,
                variance: 3,
                variancePercent: 20,
                efficiency: 83
              },
              {
                id: 9,
                name: "Kevin Moore",
                role: "Bookkeeping Manager",
                budgetHours: 5,
                actualHours: 6,
                variance: 1,
                variancePercent: 20,
                efficiency: 83
              }
            ]
          }
        ],
        summary: {
          totalProjects: 3,
          projectsOnBudget: 0,
          projectsOverBudget: 2,
          projectsUnderBudget: 1,
          avgBudgetVariance: 11.1,
          mostOverBudgetPhase: "Data Collection",
          mostEfficientStaff: "Emily Davis (125%)",
          leastEfficientStaff: "John Smith (73%)"
        },
        recentlyCompletedProjects: [
          {
            id: 1,
            name: "Adams Family Tax Return",
            client: "Adams Family",
            budgetHours: 28,
            actualHours: 34.5,
            variance: 6.5,
            variancePercent: 23.2
          },
          {
            id: 2,
            name: "White Family Business Advisory",
            client: "D. White Enterprises",
            budgetHours: 40,
            actualHours: 36,
            variance: -4,
            variancePercent: -10
          },
          {
            id: 4,
            name: "Smith & Co Audit",
            client: "Smith & Co",
            budgetHours: 120,
            actualHours: 118,
            variance: -2,
            variancePercent: -1.7
          }
        ],
        topProblematicPhases: [
          {
            name: "Data Collection",
            avgVariancePercent: 50,
            occurrences: 3
          },
          {
            name: "Initial Review",
            avgVariancePercent: 37.5,
            occurrences: 5
          },
          {
            name: "Account Reconciliation",
            avgVariancePercent: 40,
            occurrences: 2
          },
          {
            name: "Financial Statement Preparation",
            avgVariancePercent: 20,
            occurrences: 4
          },
          {
            name: "Tax Preparation",
            avgVariancePercent: 8.3,
            occurrences: 8
          }
        ],
        staffEfficiency: [
          {
            name: "Emily Davis",
            role: "Advisory Associate",
            efficiency: 125
          },
          {
            name: "Michael Brown",
            role: "Tax Partner",
            efficiency: 100
          },
          {
            name: "Lisa Rodriguez",
            role: "Advisory Partner",
            efficiency: 100
          },
          {
            name: "Daniel Wilson",
            role: "Advisory Manager",
            efficiency: 100
          },
          {
            name: "Sarah Johnson",
            role: "Tax Manager",
            efficiency: 94
          },
          {
            name: "Jessica Lee",
            role: "Senior Bookkeeper",
            efficiency: 83
          },
          {
            name: "Kevin Moore",
            role: "Bookkeeping Manager",
            efficiency: 83
          },
          {
            name: "Robert Taylor",
            role: "Bookkeeping Staff",
            efficiency: 83
          },
          {
            name: "John Smith",
            role: "Senior Tax Associate",
            efficiency: 73
          }
        ]
      });
    } catch (error) {
      console.error("Error generating budget vs. actual data:", error);
      res.status(500).json({ error: "Error generating budget vs. actual data" });
    }
  });

  app.get("/api/time-analytics-dashboard", async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        firmId, 
        staffId, 
        clientId, 
        serviceCategory 
      } = req.query;
      
      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      // For now, return a sample response structure that matches what our dashboard needs
      res.json({
        firmOverview: {
          totalHours: 1240,
          totalRevenue: 187500,
          averageRate: 151.21,
          byMonth: [
            { month: "Jan", hours: 410, revenue: 62000 },
            { month: "Feb", hours: 380, revenue: 58000 },
            { month: "Mar", hours: 450, revenue: 67500 }
          ],
          byService: [
            { name: "Tax Prep", hours: 580, revenue: 84000 },
            { name: "Bookkeeping", hours: 320, revenue: 41000 },
            { name: "Advisory", hours: 220, revenue: 44000 },
            { name: "Audit", hours: 120, revenue: 18500 }
          ],
          byStaff: [
            { name: "Partner", hours: 280, revenue: 70000 },
            { name: "Manager", hours: 360, revenue: 61200 },
            { name: "Senior", hours: 400, revenue: 40000 },
            { name: "Staff", hours: 200, revenue: 16300 }
          ]
        },
        staffOverview: {
          utilization: 78,
          totalStaff: 12,
          byUtilization: [
            { name: "Partner", utilization: 65, target: 70 },
            { name: "Manager", utilization: 82, target: 80 },
            { name: "Senior", utilization: 88, target: 85 },
            { name: "Staff", utilization: 72, target: 75 }
          ],
          byRevenue: [
            { name: "Partner", revenue: 70000 },
            { name: "Manager", revenue: 61200 },
            { name: "Senior", revenue: 40000 },
            { name: "Staff", revenue: 16300 }
          ]
        },
        clientOverview: {
          totalClients: 38,
          activeClients: 24,
          byRevenue: [
            { name: "Adams Family", revenue: 12500 },
            { name: "XYZ Corp", revenue: 8700 },
            { name: "123 Industries", revenue: 7300 },
            { name: "Smith Consulting", revenue: 6800 },
            { name: "Other Clients", revenue: 152200 }
          ],
          byHours: [
            { name: "Adams Family", hours: 82 },
            { name: "XYZ Corp", hours: 64 },
            { name: "123 Industries", hours: 51 },
            { name: "Smith Consulting", hours: 48 },
            { name: "Other Clients", hours: 995 }
          ],
          byProfitability: [
            { name: "High", count: 8 },
            { name: "Medium", count: 12 },
            { name: "Low", count: 4 }
          ]
        }
      });
    } catch (error: any) {
      console.error("Error fetching time analytics data:", error);
      res.status(500).json({ error: "Failed to fetch time analytics data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
