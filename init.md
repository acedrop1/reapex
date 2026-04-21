Apex:
This is the culmination of all our planning. Here is the definitive blueprint for the Reapex Agent Portal, structured as a comprehensive guide for our web developer.
This document outlines the complete sitemap, feature set, and the specific third-party integrations required to build our "all-in-one" platform.
Reapex Agent Portal: Developer Blueprint
1.⁠ ⁠High-Level Goal
To build a unified "single pane of glass" web application where an agent can manage their entire business, from lead nurture (CRM) and marketing (Canva) to contracts (ZipForms), compliance (our custom tool), and financials (QuickBooks & our tool).
2.⁠ ⁠Core Navigation (Sitemap)
This is the persistent left-hand sidebar navigation structure.
 * Dashboard
 * Calendar
 * CRM
 * Transactions
 * Marketing Center
 * Training & Resources
 * Announcements
 * My Profile
3.⁠ ⁠Feature & Integration Breakdown (By Tab)
Here is the specific build plan, detailing what is custom-built ("Build") vs. what is integrated ("Buy").
Dashboard
 * Function: The agent's daily "at-a-glance" hub.
 * Build/Buy: Build (This is a custom-built page composed of widgets).
 * Integrations:
   * My Tasks Widget: Follow Up Boss API (Read-only). Fetches and displays tasks assigned to the agent.
   * New Leads Widget: Follow Up Boss API (Read-only). Fetches a list of new, uncontacted leads.
   * Pipeline Snapshot Widget: Follow Up Boss API (Read-only). Fetches deal/pipeline stage data to render a simple chart.
   * Pending Commissions Widget: Custom Transaction Manager DB (Read-only). Pulls "pending" GCI from our own database.
   * Cap Progress Widget: Custom Transaction Manager DB (Read-only). Pulls the agent's cap status from our Users table.
   * Announcements & Calendar Widgets: Custom DB (Read-only). Pulls the latest items from our own Announcements and Calendar tables.
Calendar
 * Function: A unified calendar showing all business-related events.
 * Build/Buy: Build (We will use a frontend calendar component like FullCalendar or similar).
 * Integrations:
   * FUB Tasks/Appointments: Follow Up Boss API (Read-read-only). Pulls all calendar events and tasks with dates from FUB.
   * Transaction Dates: Custom Transaction Manager DB (Read-only). Pulls all key dates (closing, contingencies) from our Transactions table.
   * Brokerage Events: Custom DB (Read-only). Pulls company-wide events set by an Admin.
CRM
 * Function: The agent's full lead and contact management database.
 * Build/Buy: Buy (Embed).
 * Third-Party Tool: Follow Up Boss (Platform Plan)
 * Integration Method:
   * Full Application Embed: We will use the <fub-embed> element or a secure iFrame.
   * Single Sign-On (SSO): The agent clicks "CRM" and is automatically logged into their FUB account within our portal shell. No separate login is required.
Transactions
 * Function: Our proprietary compliance and deal-management hub. The "secret sauce."
 * Build/Buy: Build (This is our core custom application).
 * Sub-Sections: Transaction List and Transaction Detail.
 * Key Integrations (Inside Transaction Detail):
   * ZipFormsPlus:
     * UI: A "Write Contract in ZipForms" button.
     * Tool: Lone Wolf Transact (ZipForms).
     * Method: Embedded SSO (via Lone Wolf Partner API). Clicking the button logs the agent into ZipForms inside an embedded window/tab and (using the API) passes data (client name, address, price) to pre-fill the forms.
   * RPR (narrpr.com):
     * UI: A "Generate RPR Report" button.
     * Tool: RPR Broker Tools.
     * Method: Embedded SSO (RPR Connect®️). Clicking the button logs the agent into RPR and uses a Deep Link to take them directly to the subject property's report page.
Marketing Center
 * Function: A hub for all branding and property marketing tools.
 * Build/Buy: Build (This is a custom-built page that links to other services).
 * Sub-Sections & Integrations:
   * Brand Templates:
     * Tool: Canva (for Teams).
     * Method: Embedded SSO Link. A button that logs the agent directly into our Reapex shared folder within Canva.
   * Property Websites:
     * Tool: This is a Custom-Built Feature.
     * Method: The tool will pull listing data (photos, description, price) from our Transactions DB (for listings only) and generate a simple, beautiful single-property website.
Training & Resources
 * Function: Our on-demand training and document library.
 * Build/Buy: Build (A custom-built section with simple content pages).
 * Sub-Sections:
   * Video Library: Embedded videos (hosted on Vimeo/YouTube).
   * Company Documents: A file list of PDFs (hosted in our S3 bucket).
   * Knowledge Base: A simple FAQ section.
Announcements
 * Function: A dedicated feed for all company news.
 * Build/Buy: Build (A simple custom tool with an Admin-facing text editor and an agent-facing read-only feed).
My Profile
 * Function: Agent's personal settings and all financial data.
 * Build/Buy: Build (A custom-built, multi-tabbed settings page).
 * Sub-Sections & Integrations:
   * Profile Settings: Custom-built form to edit profile (headshot, bio, etc.).
   * Financials:
     * Commissions & Cap Tracker: This is Custom-Built. It is a read-only dashboard populated by our Transaction Manager. When an Admin "Closes Out" a deal, our code automatically calculates the split/cap and pushes the final numbers here.
   * Brokerage Billing:
     * Tool: QuickBooks Online (Essentials Plan).
     * Method: QBO Accounting API (Read-only). This tab will make a secure, server-side API call to fetch all Invoice and SalesReceipt objects for that agent (mapped by Customer ID) and display them in a clean, itemized list.
4.⁠ ⁠Public-Facing Website Integrations (The "Ecosystem")
These are not in the portal UI but are critical for the system to function.
 * Showcase IDX: This is our public website's MLS/IDX search engine.
   * Integration: It must be deeply integrated with Follow Up Boss. All new lead registrations and property search activity (views, saves) from Showcase must be instantly pushed into the correct contact's timeline in FUB.
 * Follow Up Boss Pixel:
   * Integration: The FUB tracking pixel must be installed on our public Reapex website and on all agent subdomains to track client activity.
Summary of All Third-Party Integrations
| Tool / Service | Plan Required | Integration Method | Purpose |
|---|---|---|---|
| Follow Up Boss | Platform Plan | API (Read-only) & Full Embed (SSO) | CRM, Tasks, Calendar, Pipeline |
| ZipFormsPlus | Brokerage License | Embedded SSO & Data-Pass API | Contracts & E-Signatures |
| RPR (narrpr.com) | Broker Tools (Free) | Embedded SSO & Deep Link API | Property Data & Reports (CMA) |
| Canva | Canva for Teams | Embedded SSO Link | Marketing Templates |
| QuickBooks Online | Essentials Plan | Accounting API (Read-only) | Recurring Fee/Billing History |
| Showcase IDX | (TBD) | FUB API Integration (Write) | Public IDX Search -> Pushes leads to FUB |
| Amazon S3 | (Standard) | Backend API | Secure storage for transaction documents. 