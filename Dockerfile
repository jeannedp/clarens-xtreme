FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run db:migrate
RUN npm run build

# ------------------------------
  
FROM node:24-alpine AS serve
WORKDIR /app
  
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

# For `npm run db:migrate` (Railway pre-deploy, see .railway/railway.ts): the
# Supabase CLI ships in node_modules; it only needs the migrations and the
# project config.
COPY --from=build /app/supabase/config.toml ./supabase/config.toml
COPY --from=build /app/supabase/migrations ./supabase/migrations

EXPOSE 3000

CMD [ "npm", "run", "start" ]
