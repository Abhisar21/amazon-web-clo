const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const DB_PATH = path.join(__dirname, 'data', 'store.db');

if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Open DB
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open DB:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite DB at', DB_PATH);
});

// Helpers
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const user = { id: this.lastID, email };
      const token = generateToken(user);
      res.json({ user, token });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get('SELECT id, email, password_hash FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const user = { id: row.id, email: row.email };
    const token = generateToken(user);
    res.json({ user, token });
  });
});

// Products
app.get('/api/products', (req, res) => {
  db.all('SELECT id, title, description, price, image_url FROM products', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT id, title, description, price, image_url FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  });
});

// Cart endpoints (persisted per user)
app.get('/api/cart', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT c.product_id as productId, c.qty, p.title, p.price FROM carts c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/cart', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { productId, qty } = req.body;
  if (!productId || !qty) return res.status(400).json({ error: 'productId and qty required' });
  // Upsert cart row
  db.get('SELECT qty FROM carts WHERE user_id = ? AND product_id = ?', [userId, productId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      db.run('UPDATE carts SET qty = qty + ? WHERE user_id = ? AND product_id = ?', [qty, userId, productId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    } else {
      db.run('INSERT INTO carts (user_id, product_id, qty) VALUES (?, ?, ?)', [userId, productId, qty], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    }
  });
});

app.post('/api/checkout', authMiddleware, (req, res) => {
  const userId = req.user.id;
  // Simple checkout: clear carts for user
  db.run('DELETE FROM carts WHERE user_id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Checkout simulated (no payments).' });
  });
});

// Serve client
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Server listening on http://localhost:' + PORT);
});