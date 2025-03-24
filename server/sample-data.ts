/**
 * Comprehensive sample data for the CPA Firm Manager application
 * This file contains realistic data to populate the database
 */

/**
 * Sample Users
 */
export const sampleUsers = [
  {
    username: "admin",
    password: "admin", // In production, this would be hashed
    email: "admin@cpafirmmanager.com",
    first_name: "Admin",
    last_name: "User",
    role: "admin",
    is_active: true
  },
  {
    username: "sarahcpa",
    password: "password123", // In production, this would be hashed
    email: "sarah@eastsidefiscal.com",
    first_name: "Sarah",
    last_name: "Johnson",
    role: "professional",
    is_active: true
  },
  {
    username: "michaeltax",
    password: "password123", // In production, this would be hashed
    email: "michael@eastsidefiscal.com",
    first_name: "Michael",
    last_name: "Williams",
    role: "professional",
    is_active: true
  },
  {
    username: "roberta",
    password: "password123", // In production, this would be hashed
    email: "roberta@valleyaccounting.com",
    first_name: "Roberta",
    last_name: "Martinez",
    role: "professional",
    is_active: true
  },
  {
    username: "david",
    password: "password123", // In production, this would be hashed
    email: "david@valleyaccounting.com",
    first_name: "David",
    last_name: "Chen",
    role: "professional",
    is_active: true
  }
];

/**
 * Sample Firms
 */
export const sampleFirms = [
  {
    name: "Eastside Fiscal Services",
    description: "A boutique CPA firm specializing in small business accounting and tax services",
    address: "123 Main Street, Suite 300",
    city: "Portland",
    state: "OR",
    zip_code: "97214",
    website: "www.eastsidefiscal.com",
    email: "info@eastsidefiscal.com",
    phone: "503-555-1234",
    is_active: true
  },
  {
    name: "Valley Accounting Professionals",
    description: "Full-service accounting firm with expertise in tax preparation and business advisory",
    address: "456 Oak Avenue",
    city: "San Jose",
    state: "CA",
    zip_code: "95131",
    website: "www.valleyaccounting.com",
    email: "contact@valleyaccounting.com",
    phone: "408-555-7890",
    is_active: true
  }
];

/**
 * Sample Professional Roles
 */
export const sampleProfessionalRoles = [
  {
    name: "Tax Accountant",
    description: "Specializes in tax preparation, planning, and compliance",
    top_tier_rate: "250",
    mid_tier_rate_percent: "75",
    low_tier_rate_percent: "50",
    is_active: true
  },
  {
    name: "Audit Specialist",
    description: "Performs financial statement audits and assurance services",
    top_tier_rate: "275",
    mid_tier_rate_percent: "70",
    low_tier_rate_percent: "45",
    is_active: true
  },
  {
    name: "Business Advisor",
    description: "Provides business consulting and advisory services",
    top_tier_rate: "300",
    mid_tier_rate_percent: "75",
    low_tier_rate_percent: "50",
    is_active: true
  },
  {
    name: "Bookkeeper",
    description: "Handles day-to-day accounting and bookkeeping tasks",
    top_tier_rate: "150",
    mid_tier_rate_percent: "80",
    low_tier_rate_percent: "60",
    is_active: true
  }
];

/**
 * Sample Services
 */
export const sampleServices = [
  {
    name: "Individual Tax Return Preparation",
    description: "Preparation and filing of individual tax returns",
    category: "Tax",
    default_rate: "300",
    is_active: true
  },
  {
    name: "Business Tax Return Preparation",
    description: "Preparation and filing of business tax returns",
    category: "Tax",
    default_rate: "750",
    is_active: true
  },
  {
    name: "Monthly Bookkeeping",
    description: "Regular bookkeeping services including reconciliation and financial statement preparation",
    category: "Accounting",
    default_rate: "450",
    is_active: true
  },
  {
    name: "Payroll Processing",
    description: "Complete payroll services including tax filings",
    category: "Accounting",
    default_rate: "350",
    is_active: true
  },
  {
    name: "Business Formation",
    description: "Assistance with business entity formation and structure",
    category: "Advisory",
    default_rate: "1200",
    is_active: true
  },
  {
    name: "Financial Statement Audit",
    description: "Comprehensive audit of financial statements",
    category: "Audit",
    default_rate: "5000",
    is_active: true
  },
  {
    name: "Tax Planning",
    description: "Strategic tax planning and minimization strategies",
    category: "Advisory",
    default_rate: "1500",
    is_active: true
  },
  {
    name: "IRS Representation",
    description: "Representation before the IRS for audits or disputes",
    category: "Tax",
    default_rate: "2500",
    is_active: true
  }
];

/**
 * Sample Contacts
 */
export const sampleContacts = [
  {
    first_name: "John",
    last_name: "Smith",
    email: "john@abctechnology.com",
    phone: "415-555-2345",
    address: "789 Tech Blvd",
    city: "San Francisco",
    state: "CA",
    zip_code: "94105",
    contact_type: "client",
    notes: "Primary contact for ABC Technology, prefers email communication",
    is_active: true
  },
  {
    first_name: "Emily",
    last_name: "Davis",
    email: "emily@greenfoodsco.com",
    phone: "503-555-6789",
    address: "567 Organic Way",
    city: "Portland",
    state: "OR",
    zip_code: "97202",
    contact_type: "client",
    notes: "CEO of Green Foods Co, very responsive",
    is_active: true
  },
  {
    first_name: "Robert",
    last_name: "Jones",
    email: "robert@citylaw.com",
    phone: "408-555-4321",
    address: "234 Legal Avenue",
    city: "San Jose",
    state: "CA",
    zip_code: "95126",
    contact_type: "client",
    notes: "Managing partner at City Law Firm, prefers phone calls",
    is_active: true
  },
  {
    first_name: "Lisa",
    last_name: "Brown",
    email: "lisa@designstudio.com",
    phone: "971-555-8765",
    address: "432 Creative Street",
    city: "Portland",
    state: "OR",
    zip_code: "97204",
    contact_type: "client",
    notes: "Owner of Design Studio, very detail-oriented",
    is_active: true
  }
];

/**
 * Sample Client Companies
 */
export const sampleClientCompanies = [
  {
    name: "ABC Technology Solutions, Inc.",
    industry: "Technology",
    email: "accounting@abctechnology.com",
    phone: "415-555-2345",
    address: "789 Tech Blvd",
    city: "San Francisco",
    state: "CA",
    zip_code: "94105",
    website: "www.abctechnology.com",
    ein: "12-3456789",
    is_active: true
  },
  {
    name: "Green Foods Co.",
    industry: "Food & Beverage",
    email: "finance@greenfoodsco.com",
    phone: "503-555-6789",
    address: "567 Organic Way",
    city: "Portland",
    state: "OR",
    zip_code: "97202",
    website: "www.greenfoodsco.com",
    ein: "98-7654321",
    is_active: true
  },
  {
    name: "City Law Firm, LLP",
    industry: "Legal Services",
    email: "accounting@citylaw.com",
    phone: "408-555-4321",
    address: "234 Legal Avenue",
    city: "San Jose",
    state: "CA",
    zip_code: "95126",
    website: "www.citylaw.com",
    ein: "45-6789123",
    is_active: true
  },
  {
    name: "Design Studio Creative, LLC",
    industry: "Creative Services",
    email: "finance@designstudio.com",
    phone: "971-555-8765",
    address: "432 Creative Street",
    city: "Portland",
    state: "OR",
    zip_code: "97204",
    website: "www.designstudio.com",
    ein: "78-9123456",
    is_active: true
  }
];

/**
 * Sample Projects
 */
export const sampleProjects = [
  {
    name: "ABC Technology 2024 Tax Compliance",
    description: "Annual tax return preparation and filing for ABC Technology",
    status: "active",
    start_date: "2024-01-15T00:00:00Z",
    end_date: "2024-04-15T00:00:00Z",
    estimated_hours: "40"
  },
  {
    name: "Green Foods Monthly Bookkeeping",
    description: "Ongoing monthly bookkeeping and financial statement preparation",
    status: "active",
    start_date: "2024-01-01T00:00:00Z",
    end_date: null,
    estimated_hours: "10"
  },
  {
    name: "City Law Firm Financial Statement Audit",
    description: "Annual audit of financial statements",
    status: "pending",
    start_date: "2024-05-01T00:00:00Z",
    end_date: "2024-06-30T00:00:00Z",
    estimated_hours: "120"
  },
  {
    name: "Design Studio Tax Planning",
    description: "Quarterly tax planning and strategy sessions",
    status: "active",
    start_date: "2024-02-01T00:00:00Z",
    end_date: "2024-12-31T00:00:00Z",
    estimated_hours: "24"
  }
];

/**
 * Sample Proposals
 */
export const sampleProposals = [
  {
    title: "ABC Technology Business Advisory Services",
    content: "Proposal for comprehensive business advisory services including strategic planning, financial forecasting, and growth strategy development.",
    status: "sent",
    estimated_cost: "15000",
    estimated_hours: "50",
    expiry_date: "2024-04-30T00:00:00Z",
    estimated_start_date: "2024-05-15T00:00:00Z",
    estimated_end_date: "2024-08-15T00:00:00Z",
    source: "internal"
  },
  {
    title: "Green Foods Tax Planning Services",
    content: "Proposal for tax planning services focused on reducing tax liability through strategic planning and identification of applicable credits and deductions.",
    status: "accepted",
    estimated_cost: "8500",
    estimated_hours: "30",
    expiry_date: "2024-03-31T00:00:00Z",
    estimated_start_date: "2024-04-15T00:00:00Z",
    estimated_end_date: "2024-07-15T00:00:00Z",
    source: "internal"
  },
  {
    title: "City Law Firm Payroll Services",
    content: "Proposal for comprehensive payroll processing services including tax filings, direct deposits, and year-end reporting.",
    status: "draft",
    estimated_cost: "12000",
    estimated_hours: "5",
    expiry_date: null,
    estimated_start_date: "2024-06-01T00:00:00Z",
    estimated_end_date: "2025-05-31T00:00:00Z",
    source: "internal"
  },
  {
    title: "Design Studio Financial Statement Audit",
    content: "Proposal for a comprehensive audit of financial statements to ensure compliance with generally accepted accounting principles.",
    status: "pending_assignment",
    estimated_cost: "25000",
    estimated_hours: "100",
    expiry_date: "2024-05-15T00:00:00Z",
    estimated_start_date: "2024-06-01T00:00:00Z",
    estimated_end_date: "2024-07-31T00:00:00Z",
    source: "external",
    request_details: {
      request_date: "2024-03-01T00:00:00Z",
      external_contact_email: "lisa@designstudio.com",
      external_phone: "971-555-8765",
      priority: "high",
      additional_notes: "Need audit completed by end of July for investor requirements"
    }
  }
];

/**
 * Sample Deadlines
 */
export const sampleDeadlines = [
  {
    title: "ABC Technology Tax Filing Deadline",
    description: "Final filing deadline for corporate tax return",
    due_date: "2024-04-15T00:00:00Z",
    priority: "high",
    status: "pending"
  },
  {
    title: "Green Foods Q1 Financial Review",
    description: "Quarterly financial statement review meeting",
    due_date: "2024-04-30T00:00:00Z",
    priority: "medium",
    status: "pending"
  },
  {
    title: "City Law Firm Partner Tax Estimates",
    description: "Quarterly estimated tax payment preparation for partners",
    due_date: "2024-04-15T00:00:00Z",
    priority: "high",
    status: "pending"
  },
  {
    title: "Design Studio Sales Tax Filing",
    description: "Monthly sales tax return filing",
    due_date: "2024-03-31T00:00:00Z",
    priority: "medium",
    status: "completed",
    is_completed: true
  }
];