# FUNCTIONAL_REQUIREMENTS

## 1. Overview
The **ISP Circuit Assessment Application** is a comprehensive platform for managing ISP circuits, locations, and proposals with real-time collaboration capabilities. Two user roles exist:

1. **Admin**: Can perform **all** CRUD (Create, Read, Update, Delete) operations on companies, locations, and circuits.  
2. **Viewer**: Can **view** all records but **cannot** modify data.

The application features real-time updates, interactive maps, and a proposal system for comparing circuit configurations.

---

## 2. User Authentication & Roles

1. **Basic Sign In**  
   - Users sign in with email/password authentication
   - After authentication, the user is assigned a role:
     - **Admin** or **Viewer**.
   - First user automatically becomes admin
   - Profile management with name, contact details

2. **Permissions**  
    - **Admin**:  
      - Create, edit, and delete records in all tables (companies, locations, circuits).
      - Manage user roles and permissions
      - Access system configuration
    - **Viewer**:  
      - **Read-only** access.
      - Can view proposals and circuit comparisons

3. **Profile Management**
   - Users can update their profile information
   - Admins can view and manage all user profiles
   - Contact information synced with auth system

---

## 3. Company Management

### 3.1 Company Data Model
Each company record corresponds to a row in the **`companies`** table with the following fields:
- `id` (UUID): Primary key
- `name`: Company name
- `street_address`: Street address (validated)
- `address_city`: City name
- `address_state`: State name
- `address_zip`: ZIP/Postal code
- `address_country`: Country name
- `phone` (character varying(20)): Contact phone number
- `email` (character varying(255)): Contact email address
- `website` (character varying(255)): Company website URL
- `created_at` (timestamp with time zone): Record creation timestamp
- `updated_at` (timestamp with time zone): Record update timestamp

### 3.2 Functional Requirements

- **Create Company (Admin Only)**  
  - Provide mandatory fields with address validation
  - Geocoding support for location mapping
  - Auto-generate `id`, `created_at`, and `updated_at`.
  
- **View Companies (Admin & Viewer)**  
  - List/grid view with sorting and filtering
  - Search by name, city, state
  - Interactive cards with contact details
  
- **Update Company (Admin Only)**  
  - Update company details with address validation
  - Track modifications with audit trail
  - Update `updated_at` automatically.
  
- **Delete Company (Admin Only)**  
  - Cascade delete to related records
  - Show dependency warnings
  - Audit trail for deletions

### 3.3 Address Management

- Address validation using Azure Maps API
- Geocoding for map visualization
- Standardized address format
- Country support with state/province handling

---

## 4. Location Management

### 4.1 Location Data Model
Each location record is in the **`locations`** table:
- `id` (UUID): Primary key
- `name`: Location name
- `address` (text): Street address
- `city` (character varying(100)): City name
- `state` (character varying(50)): State name
- `zip_code` (character varying(20)): ZIP/Postal code
- `country` (character varying(100)): Country name
- `criticality` (character varying(10)): "High", "Low", "Medium", etc.
- `created_at` (timestamp with time zone): Creation timestamp
- `site_description`: Description of the site
- `critical_processes`: Critical business processes
- `active_users`: Number of active users
- `num_servers`: Number of servers
- `num_devices`: Number of devices
- `hosted_applications`: Critical hosted applications
- `updated_at` (timestamp with time zone): Update timestamp
- `company_id` (UUID): Foreign key referencing `companies.id`

### 4.2 Functional Requirements

- **Create Location (Admin Only)**  
  - Link the location to a valid `company_id`.  
  - Validate and geocode address
  - Set criticality and site details
  - Auto-generate `id`, `created_at`, and `updated_at`.
  
- **View Locations (Admin & Viewer)**  
  - List/grid view with sorting options
  - Filter by multiple criteria
  - Interactive map visualization
  - Search by location name.

- **Update Location (Admin Only)**  
  - Update location details and address
  - Manage site information
  - Update `updated_at` on save.  
  - Validate `company_id` if changed.

- **Delete Location (Admin Only)**  
  - Handle dependent circuits
  - Confirm or cascade the delete if business rules allow.

#### Representative UI (Locations Page)
Below is a sample **Locations** screen:

*(See **Locations Screenshot** in the attached images.)*

- **List/Grid view** with detailed cards
- Interactive map with location markers
- Sorting and filtering capabilities
- **Create Location** button invokes a modal or a form to add a new location.

---

## 5. Circuit Management

### 5.1 Circuit Data Model
Each circuit record in the **`circuits`** table includes:
- `id` (UUID): Primary key
- `carrier` (text): Carrier or ISP name
- `type` (text): Circuit type (e.g., "MPLS", "DIA", "Broadband")
- `purpose` (text): "Primary", "Secondary", "Backup", etc.
- `status` (text): "Active", "Inactive", "Quoted", etc.
- `bandwidth` (text): Advertised bandwidth (e.g., "100 Mbps")
- `monthlycost` (numeric): Monthly recurring cost
- `static_ips` (integer): Number of static IP addresses
- `upload_bandwidth` (character varying(255)): Upload speed detail
- `contract_start_date` (date): Contract start
- `contract_term` (integer): Term length in months
- `contract_end_date` (date): Contract end
- `billing` (character varying(10)): Billing frequency (e.g., "Monthly")
- `usage_charges` (boolean): Whether usage-based charges apply
- `installation_cost` (numeric(10,2)): Installation fee
- `notes` (text): Additional remarks
- `location_id` (UUID): Foreign key referencing `locations.id`

### 5.2 Functional Requirements

- **Create Circuit (Admin Only)**  
  - Must reference a valid `location_id`.  
  - Set circuit details and contract terms
  - Validate dates and costs
  - Auto-generate `id`, track `created_at` and `updated_at`.

- **View Circuits (Admin & Viewer)**  
  - List/card view with detailed information
  - Advanced filtering and sorting
  - Search by carrier name or other attributes.

- **Update Circuit (Admin Only)**  
  - Update circuit and contract details
  - Automatic contract term calculation
  - Validate all date relationships
  - Update `updated_at`.

- **Delete Circuit (Admin Only)**  
  - Check dependencies and usage
  - Audit trail for deletions

#### Representative UI (Circuits Page & Circuit Form)
1. **Circuits Page**:  
   - Displays a **table** of circuits with columns for Carrier, Type, Purpose, Status, Bandwidth, Monthly Cost, and Location.  
   - Sorting and searching features in the header.  
   - **Create Circuit** button to add new entries.

2. **Circuit Forms**:  
  - Comprehensive input validation
  - Dynamic contract calculations
  - **Save** button to commit changes, **Cancel** to discard.

*(See **Circuits Screenshots** in the attached images.)*

---

## 6. Data Management

### 6.1 Data Validation
- **Field Validation**  
  - Numeric field constraints
  - Date relationship validation
  - Foreign key integrity
  
### 6.2 Search & Filtering
- **Advanced Search**  
  - Full-text search capabilities
  - Multi-criteria filtering
  - Persistent filter state

### 6.3 Data Import/Export
- CSV import/export
- Excel export with formatting
- Bulk operations support

### 6.2 Data Security
- Enforce **role-based access** at the application layer (Admin vs. Viewer).  
- Keep **audit trails** in logs or via `created_at`/`updated_at`.  
- Use **encryption** in transit (HTTPS) and at rest if required.

---

## 7. Reporting & Analytics

### 7.1 Dashboard (Admin & Viewer)
- **Key Metrics Display**:
  - Circuit counts and status
  - Cost analysis
  - Location statistics

- **Interactive Charts**:
  - Circuit distribution
  - Cost trends
  - Location map

#### Representative UI (Dashboard)
Below is a sample **Dashboard** screen:

*(See **Dashboard Screenshot** in the attached images.)*

- Metric cards with real-time updates
- Interactive map visualization
- Cost analysis charts

## 8. Proposal System

### 8.1 Proposal Management
- Create and manage circuit proposals
- Select locations and circuits
- Compare proposed vs. existing circuits

### 8.2 Circuit Comparison
- Visual diff of circuit changes
- Cost impact analysis
- Export comparison reports

### 8.3 Proposal Workflow
- Draft/Pending/Approved/Rejected states
- Validation period tracking
- Notes and documentation

---

## 9. Performance Requirements

### 9.1 Response Times
- **API Responses**: ~500ms or faster for typical queries.  
- **Page Loads**: Under 2 seconds on average.  
- **Search**: Return filtered results in ~300ms.

### 9.2 Scalability
- **Thousands** of companies, **tens of thousands** of locations, and **hundreds of thousands** of circuits.  
- Data storage up to **1TB**.

### 9.3 Real-time Updates
- Instant data synchronization
- Optimistic UI updates
- Conflict resolution

---

## 10. Technical Implementation
- React with TypeScript
- Supabase for backend and real-time
- Azure Maps integration
- Dark mode support