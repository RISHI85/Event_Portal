const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const Registration = require('./models/Registration');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());

// Mount Stripe webhook BEFORE JSON parsing
const { webhookHandler, sendCertificatesForRegistration } = require('./routes/registrations');
app.post('/api/registrations/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// Standard parsers for the rest of the routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/upload', require('./routes/upload'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Event Management API is running!' });
});

// Optional: Background auto-dispatch of certificates after event completion
if (process.env.CERT_AUTODISPATCH === 'true') {
  const intervalMs = parseInt(process.env.CERT_AUTODISPATCH_INTERVAL_MS || '600000', 10); // default 10 minutes
  const tick = async () => {
    try {
      const now = Date.now();
      const regs = await Registration.find({
        paymentStatus: 'completed',
        certificateSent: { $ne: true },
      })
        .populate('eventId')
        .populate('userId', 'email name')
        .limit(50);

      for (const r of regs) {
        const ev = r.eventId;
        if (!ev || !ev.date) continue;
        const dt = new Date(ev.date);
        if (!Number.isNaN(dt.getTime()) && dt.getTime() < now) {
          try { await sendCertificatesForRegistration(r); }
          catch (e) { console.error('Auto-dispatch: sendCertificatesForRegistration failed:', e?.message || e); }
        }
      }
    } catch (e) {
      console.error('Auto-dispatch certificates error:', e);
    }
  };
  setInterval(tick, intervalMs);
  console.log(`Certificate auto-dispatch enabled (every ${intervalMs} ms)`);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
