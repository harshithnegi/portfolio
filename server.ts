import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Contact Form
  app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    const formspreeId = process.env.FORMSP_ID;

    console.log(`Received contact form from ${name} (${email}): ${subject}`);

    if (!formspreeId) {
      console.warn('FORMSP_ID not set in environment variables. Message logged but not sent to Formspree.');
      return res.json({ success: true, message: 'Message logged (FORMSP_ID missing)' });
    }

    try {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      });

      if (response.ok) {
        res.json({ success: true });
      } else {
        const errorData = await response.json();
        console.error('Formspree error:', errorData);
        res.status(500).json({ success: false, error: 'Failed to send to Formspree' });
      }
    } catch (error) {
      console.error('Server error during contact submission:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
