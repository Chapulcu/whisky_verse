#!/bin/sh
set -e

# Default values
export API_URL=${API_URL:-http://localhost:3000}
export SUPABASE_URL=${SUPABASE_URL:-https://your-project.supabase.co}

echo "🚀 Starting WhiskyVerse frontend..."
echo "📡 API URL: $API_URL"
echo "🗄️  Supabase URL: $SUPABASE_URL"

# Replace environment variables in nginx config
envsubst '${API_URL}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

# Create runtime config for frontend
cat > /usr/share/nginx/html/runtime-config.js << EOF
window.ENV = {
  API_URL: '${API_URL}',
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
  NODE_ENV: '${NODE_ENV:-production}'
};
EOF

echo "✅ WhiskyVerse frontend configured successfully!"