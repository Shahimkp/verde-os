# Verde OS Backend Foundation

This is the Express backend for Verde OS, connecting to a Supabase PostgreSQL database using the Supabase Javascript Client.

## Installation

Inside the \`backend/\` directory, run:

\`\`\`bash
npm install
\`\`\`

## Environment Variables

Copy the \`.env.example\` file to \`.env\`:

\`\`\`bash
cp .env.example .env
\`\`\`

Fill in your actual Supabase credentials and port configuration. The \`SUPABASE_SERVICE_ROLE_KEY\` allows the backend to bypass RLS and should never be exposed to the client.

## Development Server

To start the development server using nodemon, run:

\`\`\`bash
npm run dev
\`\`\`

To start in production mode, run:

\`\`\`bash
npm start
\`\`\`

## Endpoints

### 1. Health Endpoint
\`GET /api/health\`

Returns a basic health check to confirm the API is responsive.
\`\`\`json
{
  "success": true,
  "service": "Verde OS API",
  "status": "healthy"
}
\`\`\`

### 2. Database Health Endpoint
\`GET /api/health/db\`

Verifies connectivity to the Supabase project using the service role key.
\`\`\`json
{
  "success": true,
  "service": "Verde OS API",
  "database": "connected"
}
\`\`\`
