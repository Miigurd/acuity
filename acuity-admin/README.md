# ACUITY Admin Dashboard

This is the administrative dashboard for the ACUITY framework, built with React and Vite. 
It provides the necessary tools for administrators to manage the business registry, handle verifications, and moderate flagged profiles.

## Features

- **Dashboard Home:** Overview of system statistics and pending actions.
- **Registry Management:** View and edit the database of extracted and verified local micro-enterprises.
- **Verification Queue:** Interface for validating business profiles extracted from community posts.
- **Flagged Profiles:** Moderation tools for handling user-reported or anomalous business entries.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Navigate to the admin directory:
   ```bash
   cd acuity-admin
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Building for Production
```bash
npm run build
```
The compiled assets will be output to the `dist/` folder.
