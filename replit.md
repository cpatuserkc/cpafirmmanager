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