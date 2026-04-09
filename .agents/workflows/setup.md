---
description: Enterprise POS Setup Guide
---
# POS Setup Workflow

Follow these steps to deploy and run your POS system.

## 1. Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor and paste the contents of `supabase/migrations/20260321000000_init_pos_schema.sql`.
// turbo
3. Run the SQL script to initialize tables and RLS policies.

## 2. Environment Configuration
1. Rename `.env.example` to `.env`.
2. Replace `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your project credentials.

## 3. Local Development
1. Run `npm install` to install dependencies.
2. Run `npm run dev` to start the Vite dev server.

## 4. Deployment
1. Connect your GitHub repository to Vercel or Netlify.
2. Add your environment variables to the deployment settings.
3. Your app is live!
