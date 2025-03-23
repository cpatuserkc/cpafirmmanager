import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertClientSchema,
  insertProjectSchema,
  insertTimeEntrySchema,
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

  app.post("/api/clients", validateBody(insertClientSchema), async (req, res) => {
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

  // TIME ENTRY ROUTES
  app.get("/api/time-entries", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      let timeEntries;
      if (projectId) {
        timeEntries = await storage.getTimeEntriesByProjectId(projectId);
      } else if (clientId) {
        timeEntries = await storage.getTimeEntriesByClientId(clientId);
      } else if (userId) {
        timeEntries = await storage.getTimeEntriesByUserId(userId, limit);
      } else {
        return res.status(400).json({ message: "User ID, Client ID, or Project ID is required" });
      }
      
      res.status(200).json(timeEntries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching time entries" });
    }
  });

  app.get("/api/time-entries/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const timeEntry = await storage.getTimeEntry(id);
      
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      res.status(200).json(timeEntry);
    } catch (error) {
      res.status(500).json({ message: "Error fetching time entry" });
    }
  });

  app.post("/api/time-entries", validateBody(insertTimeEntrySchema), async (req, res) => {
    try {
      const timeEntry = await storage.createTimeEntry(req.body);
      res.status(201).json(timeEntry);
    } catch (error) {
      res.status(500).json({ message: "Error creating time entry" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updatedTimeEntry = await storage.updateTimeEntry(id, req.body);
      
      if (!updatedTimeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      res.status(200).json(updatedTimeEntry);
    } catch (error) {
      res.status(500).json({ message: "Error updating time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteTimeEntry(id);
      
      if (!success) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting time entry" });
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
