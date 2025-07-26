# CPA Resource Hub

## Overview

This is a comprehensive web application designed for small CPA firms to manage their practice operations. The platform provides classification systems, time tracking, client management, proposal generation, and analytics capabilities. It's built as a full-stack application with a React frontend and Express backend, utilizing PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.
Data Architecture: Strongly prefers external JSON data sources over hardcoded values for better maintainability and scalability.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and production builds
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme configuration
- **State Management**: React Context for authentication, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and session management
- **API Design**: RESTful endpoints with comprehensive CRUD operations

## Key Components

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main entities:
- Users (CPA professionals)
- Firms (CPA practice entities)
- Client Companies and Contacts
- Projects and Time Estimates
- Proposals and Services
- Professional Roles and Classifications
- Resources and Deadlines

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with Node.js crypto module (scrypt)
- Role-based access control (free, professional, enterprise, admin)
- Multi-firm support with user-firm relationships

### ML Integration
- Modular ML provider system with adapter pattern
- In-house ML provider for analytics and insights
- External ML provider integration capability
- OpenAI integration for AI-enhanced proposals
- Comprehensive analytics including workload predictions, revenue forecasts, and client insights

### File Storage
- Replit Object Storage integration for file uploads
- Document management system for client files
- Resource library with premium/free access levels

### ProjectToolkit System
- **External Data Architecture**: All application data externalized to JSON files in ProjectToolkit directory
- **Data Categories**: 
  - CPA-specific data (roles, services, time categories, client types, industries)
  - Application configuration (theme, features, validation rules)
  - Error messages with parameter substitution
  - Menu structure and navigation definitions
  - Form templates with field definitions and validation
  - Reference data (states, countries, business entities, accounting methods)
- **Loading System**: Client-side data loader utility with caching and React context provider
- **Benefits**: Eliminates hardcoded values, improves maintainability, enables easy customization

### Python Development Tools (ProjectMgr)
- **Complete Development Toolkit**: Comprehensive Python package for managing the CPA firm resources ecosystem
- **API Server**: FastAPI-based development server with health checks, data publishing, and synchronization endpoints
- **Data Management**: Async data loading, publishing, and synchronization between local files and remote endpoints
- **Content Management**: ProjectToolkit content loading, validation, caching, and backup functionality
- **Desktop Client**: Cross-platform GUI application using ttkbootstrap with optional webview support
- **Network Synchronization**: Multi-node network sync with priority-based ordering and error handling
- **CLI Interface**: Comprehensive command-line interface for all development operations
- **Installation**: Full package with requirements.txt, setup.py, and console script entry points

## Data Flow

1. **Authentication Flow**: Users log in through the frontend, credentials are validated by the backend using Passport.js, and sessions are maintained
2. **Data Fetching**: Frontend uses TanStack Query to fetch data from REST endpoints, with automatic caching and error handling
3. **Form Submissions**: React Hook Form handles client-side validation using Zod schemas, data is sent to backend endpoints for processing
4. **Database Operations**: Drizzle ORM handles all database interactions with type safety and migration support
5. **ML Analytics**: Analytics requests are processed through the ML adapter system, providing insights and recommendations

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router via Wouter)
- UI components (Radix UI, shadcn/ui)
- Form handling (React Hook Form, Zod)
- Data fetching (TanStack Query)
- Styling (Tailwind CSS)
- Charts and visualization (Chart.js, Recharts)

### Backend Dependencies
- Express.js web framework
- Drizzle ORM with PostgreSQL adapter
- Neon Database serverless PostgreSQL
- Passport.js for authentication
- OpenAI API for AI features
- Various utility libraries (date-fns, zod, etc.)

### Database
- PostgreSQL via Neon Database (serverless)
- Connection pooling and caching enabled
- Migration support through Drizzle Kit

## Deployment Strategy

### Development
- Uses Vite dev server for frontend hot reloading
- tsx for TypeScript execution in development
- Separate frontend and backend development servers

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single Node.js process serves both static files and API endpoints

### Environment Configuration
- Database URL required for PostgreSQL connection
- Session secret for authentication security
- Optional OpenAI API key for AI features
- Optional external ML provider API keys

The application follows modern full-stack development practices with TypeScript throughout, comprehensive error handling, and a modular architecture that supports scalability and maintainability.

## Recent Changes

### Animated Progress Tracker Implementation (January 26, 2025)
- **Feature**: Complete animated progress tracker for tax document uploads
- **Components**: Multi-stage visual progress with animated icons and real-time updates
- **User Experience**: Professional 4-stage workflow (File Upload → Processing → Analysis → Complete)
- **Technical**: React component with TypeScript interfaces, progress simulation, error handling
- **File Upload Fix**: Resolved ENOENT crash by implementing proper multer file handling with FormData
- **Benefits**: Reduces user anxiety during processing, provides clear visual feedback

### Authentication System Resolution (July 25, 2025)
- **Problem**: Frontend auth context not syncing with backend sessions after login
- **Root Cause**: Password hash format mismatch between storage and auth verification
- **Solution**: Fixed password hashing in MemStorage default admin creation to match auth.ts format
- **Result**: Login now works with persistent admin account (cpaadmin@test.com / admin123)
- **Enhancement**: Added automatic default admin user creation on server startup

### Tax Document Extraction System (January 2025)
- **Purpose**: Analyze prior year tax returns to generate customized document collection lists
- **Key Features**: 
  - Automatic form detection and vendor name extraction
  - Customized tax organizer generation with client-specific requirements
  - Progress tracking and completion monitoring
  - Integration with data engines for document processing
- **Benefits**: Eliminates manual organizer creation, improves client onboarding experience
- **Endpoints**: `/api/tax-organizer/extract`, `/api/tax-organizer/:id/document`, status tracking
- **Status**: API confirmed working, generates 13-document organizers

### Data Engines System Enhancement
- **Multi-Engine Support**: Document processing, bulk calculations, financial analysis engines
- **Asynchronous Processing**: Job management system for large-scale operations
- **QuickBooks Integration**: Enhanced analysis combining live QB data with 787 historical engagements
- **Competitive Advantage**: Only CPA platform with historical + live data + specialized processing engines