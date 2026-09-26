import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import customersRoutes from './modules/customers/customers.routes';
import staffRoutes from './modules/staff/staff.routes';
import servicesRoutes from './modules/services/services.routes';
import productsRoutes from './modules/products/products.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import aiRoutes from './modules/ai/ai.routes';
import settingsRoutes from './modules/settings/settings.routes';
import treatmentRecordsRoutes from './modules/treatment-records/treatment-records.routes';
import membershipPlansRoutes from './modules/membership-plans/membership-plans.routes';
import membershipsRoutes from './modules/memberships/memberships.routes';
import loyaltyRoutes from './modules/loyalty/loyalty.routes';
import monthlyPerksRoutes from './modules/monthly-perks/monthly-perks.routes';
import membershipGiftsRoutes from './modules/membership-gifts/membership-gifts.routes';
import servicePackagesRoutes from './modules/service-packages/service-packages.routes';
import posRoutes from './modules/pos/pos.routes';
import serviceCategoriesRoutes from './modules/service-categories/service-categories.routes';
import resourcesRoutes from './modules/resources/resources.routes';
import serviceAddonsRoutes from './modules/service-addons/service-addons.routes';
import contactRoutes from './modules/contact/contact.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Souvari Skin Lab API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/treatment-records', treatmentRecordsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/membership-plans', membershipPlansRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/monthly-perks', monthlyPerksRoutes);
app.use('/api/membership-gifts', membershipGiftsRoutes);
app.use('/api/service-packages', servicePackagesRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/service-categories', serviceCategoriesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/service-addons', serviceAddonsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);

// Serves the built React app (client/dist) so one process hosts UI + API.
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api($|\/)).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
