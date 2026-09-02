FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Dependências apenas quando necessário
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild do código fonte
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Next.js standalone mode precisa dessa variável para rodar com o server customizado
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia os arquivos necessários do builder
COPY --from=builder /app/public ./public
# Copia automaticamente o build gerado em modo standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copia o schema do prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Instalar Prisma para rodar o db push ao iniciar o container
RUN npm install prisma @prisma/client
RUN chown -R nextjs:nodejs /app/node_modules

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# O comando inicial roda o push do banco e depois o servidor
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
