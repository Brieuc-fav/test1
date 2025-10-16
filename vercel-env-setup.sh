#!/bin/bash
# Script pour configurer les variables d'environnement Vercel
# Exécuter avec: bash vercel-env-setup.sh

# Ou utiliser PowerShell avec les commandes ci-dessous

vercel env add SUPABASE_URL production
# Coller: YOUR_SUPABASE_URL

vercel env add SUPABASE_ANON_KEY production
# Coller: YOUR_SUPABASE_ANON_KEY

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Coller: YOUR_SUPABASE_SERVICE_ROLE_KEY

vercel env add AZURE_API_KEY production
# Coller: YOUR_AZURE_API_KEY

vercel env add AZURE_SORA_ENDPOINT production
# Coller: YOUR_AZURE_SORA_ENDPOINT
