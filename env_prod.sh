#!/bin/bash

# Make sure you are logged in: vercel login

vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://ckjlsnlgriyoeyrtmndu.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNramxzbmxncml5b2V5cnRtbmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjY0NTksImV4cCI6MjA4MDcwMjQ1OX0.gRCmrB6WUrXdhQd4rV-z8em0Xt553WBOWp2AngV4mz0"
vercel env add NEXT_PUBLIC_API_URL production <<< "/api"
vercel env add NEXT_PUBLIC_HCAPTCHA_SITE_KEY production <<< "votre-site-key"
vercel env add HCAPTCHA_SECRET_KEY production <<< "votre-secret-key"
vercel env add NEXT_PUBLIC_RECAPTCHA_SITE_KEY production <<< "votre-site-key"
vercel env add RECAPTCHA_SECRET_KEY production <<< "votre-secret-key"
vercel env add NEXT_PUBLIC_CAPTCHA_ENABLED production <<< "false"
vercel env add NEXT_PUBLIC_CAPTCHA_PROVIDER production <<< "hcaptcha"

echo "All variables added to Vercel production environment."