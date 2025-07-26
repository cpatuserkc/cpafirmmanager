# CPA Resource Hub - Route & Authentication Analysis

## Current Issues
1. **Authentication Failure**: "User not found" errors on login
2. **Memory Storage Reset**: In-memory storage clearing on server restart
3. **Route Inconsistencies**: Some routes may not be properly registered

## Route Structure Analysis

### Authentication Routes
- `/api/auth/register` - User registration (working)
- `/api/auth/login` - Passport.js authentication (failing)
- `/api/auth/logout` - Session logout
- `/api/auth/user` - Get current user session

### Page Routes (Frontend)
- `/login` - Login page 
- `/signup` - Registration page
- `/dashboard` - Main dashboard (auth required)
- `/tax-upload` - Tax return upload (auth required)
- `/resources` - Resources menu

### API Routes
- `/api/tax-organizer/extract` - Tax document analysis (working)
- `/api/tax-organizer/:id/document` - Document tracking
- `/api/clients/*` - Client management
- `/api/resources/*` - Resource management

## Authentication Flow Issues
1. Default admin user creation happens in MemStorage constructor
2. Password hashing format mismatch between storage and auth
3. Session persistence not working properly

## Recommended Fixes
1. Add debug endpoint to verify user storage
2. Fix password hash format consistency
3. Ensure default admin user persists
4. Add proper error handling and logging
