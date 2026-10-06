FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ------------------------------
  
FROM node:24-alpine AS serve
WORKDIR /app
  
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

# For `npm run db:migrate`: the Supabase CLI ships in node_modules; it only
# needs the migrations and the project config.
COPY --from=build /app/supabase/config.toml ./supabase/config.toml
COPY --from=build /app/supabase/migrations ./supabase/migrations

EXPOSE 3000

# Applies pending supabase/migrations before starting when DATABASE_URL is set
# (Railway); skipped otherwise (local compose). `db push` only applies
# migrations not yet recorded, so re-running it on every start is safe. If it
# fails the container exits and the deploy never turns healthy.
CMD [ "sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npm run db:migrate || exit 1; fi && exec npm run start" ]
