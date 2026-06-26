# ACUITY Frontend

This is the public-facing frontend web application for the ACUITY framework, built with React.
It serves as the main portal for residents to search, discover, and view recommendations for local micro-enterprises, as well as an interface for business owners to claim and edit their profiles.

## Features

- **Resident Dashboard:** Personalized feed and recommendations.
- **Map View:** Geospatial visualization of businesses in Barangay Banay-Banay.
- **Search & Discovery:** Search for businesses using natural language or categories.
- **Business Profiles:** Detailed views of extracted business information.
- **Profile Editing:** Interface for verified business owners to update their listings.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd acuity-frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
```bash
npm start
```
The application will run on `http://localhost:3000`. It will automatically reload if you make edits.

### Building for Production
```bash
npm run build
```
Builds the app for production to the `build/` folder, bundling React in production mode and optimizing the build for the best performance.
