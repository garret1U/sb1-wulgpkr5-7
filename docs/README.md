# ISP Circuit Assessment Application Documentation

This directory contains the comprehensive documentation for the ISP Circuit Assessment Application, a React-based web application for managing ISP circuits, locations, and proposals. The documentation is split into three main areas:

## Core Documentation Files

1. [Functional Requirements](./FUNCTIONAL_REQUIREMENTS.md)
   - User roles and permissions
   - Feature specifications
   - Data models and relationships
   - Business rules and validation requirements
   - Real-time updates and collaboration
   - Proposal management system

2. [System & Database Design](./SYSTEM_DATABASE_DESIGN.md)
   - System architecture
   - Database schema
   - Data integrity and transactions
   - Performance and scalability considerations
   - Real-time synchronization
   - Azure Maps integration

3. [UI/UX Design Requirements](./UI_UX_DESIGN_REQUIREMENTS.md)
   - Design system specifications
   - Component guidelines
   - Accessibility requirements
   - Responsive design patterns
   - Dark mode implementation
   - Interactive maps and visualizations

## Maintaining Documentation

When making changes to the application:

1. Update relevant documentation files to reflect new features or changes
2. Keep all specifications in sync with the actual implementation
3. Document any deviations from the original requirements
4. Include rationale for architectural decisions
5. Update API documentation for any backend changes
6. Document any new environment variables or configuration requirements

## Version Control

These documents are under version control and should be updated alongside code changes to maintain accuracy and relevance.

## Key Features

- **Authentication & Authorization**: Email/password authentication with admin/viewer roles
- **Company Management**: CRUD operations for companies with address validation
- **Location Management**: Geocoded locations with criticality levels and Azure Maps integration
- **Circuit Management**: Comprehensive circuit tracking with contract management
- **Proposal System**: Create and manage proposals with circuit comparisons
- **Real-time Updates**: Live data synchronization using Supabase
- **Dark Mode**: Full dark mode support with consistent styling
- **Data Import/Export**: CSV and Excel import/export capabilities

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run development server with `npm run dev`

## Deployment

The application can be deployed to Netlify with the following configuration:
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables must be configured in the deployment platform