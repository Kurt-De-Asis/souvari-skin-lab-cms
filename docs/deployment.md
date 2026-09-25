# Deployment Guide

## Development Setup

```bash
# Start MySQL (Docker)
docker-compose up -d

# Setup database
cd server
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Run both client and server
cd ..
npm run dev
```

## Production Build

### Frontend

```bash
cd client
npm run build
# Output: client/dist/
```

### Backend

```bash
cd server
npm run build
# Output: server/dist/
```

### Production Environment Variables

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:3306/iave_clinic
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
AI_API_KEY=<your-openai-api-key>
SMS_PROVIDER=semaphore
SMS_API_KEY=<your-semaphore-api-key>
SMS_SENDER=SOUVARI
```

### Start Production Server

```bash
cd server
npm start
# Serves API on PORT
# Also serves the built frontend (client/dist) automatically when it exists
# (SPA fallback included), so the UI + API share one origin.
```

### Easy online option: Cloudflare Tunnel (own clinic PC)

To put this system online with a stable URL at zero hosting cost, expose the
machine it already runs on through a **Cloudflare named tunnel** (PM2 for the
server + `cloudflared` as a Windows service). Full step-by-step kit (batch
scripts + guide): `deploy/cloudflare-clinic/README.md`.

## Production Recommendations

### Database
- Use managed MySQL (AWS RDS, Google Cloud SQL, PlanetScale)
- Enable automated backups
- Use connection pooling
- Monitor slow queries

### Security
- Generate strong random secrets for JWT
- Enable HTTPS
- Configure CORS for production domain only
- Set up rate limiting
- Enable database SSL connections

### Monitoring
- Application logs (Winston)
- Error tracking (Sentry or similar)
- Database performance monitoring
- Uptime monitoring

### Scaling
- Horizontal scaling with load balancer
- Database read replicas for analytics
- Redis for session/cache (future enhancement)

## Troubleshooting

### Common Issues

**Database connection refused**
- Ensure MySQL is running
- Check DATABASE_URL in .env
- Verify credentials

**Prisma migration fails**
- Run `npx prisma migrate reset` to reset
- Re-run `npx prisma migrate dev --name init`

**Port already in use**
- Change PORT in .env
- Kill existing process on port

**Build fails**
- Run `npm install` in both client and server
- Check Node.js version (20+)
- Clear node_modules and reinstall

**CORS errors**
- Check FRONTEND_URL in server .env
- Ensure credentials: true in Axios config
