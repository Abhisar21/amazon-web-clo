const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, 'store.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT
    )
  `);

  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      price REAL,
      image_url TEXT
    )
  `);

  db.run(`
    CREATE TABLE carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      qty INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  const stmt = db.prepare('INSERT INTO products (title, description, price, image_url) VALUES (?, ?, ?, ?)');
  const sample = [
    ['Wireless Headphones', 'Comfortable wireless headphones with noise cancellation.', 59.99, 'https://picsum.photos/seed/h1/400/300'],
    ['Coffee Maker', 'Automatic drip coffee maker with 12-cup capacity.', 39.99, 'https://picsum.photos/seed/c1/400/300'],
    ['Smartwatch', 'Fitness smartwatch with heart-rate monitor and GPS.', 129.99, 'https://picsum.photos/seed/s1/400/300'],
    ['Gaming Mouse', 'High-precision gaming mouse with RGB lighting.', 24.99, 'https://picsum.photos/seed/g1/400/300'],
    ['Standing Desk', 'Adjustable standing desk, electric lift.', 249.99, 'https://picsum.photos/seed/d1/400/300'],
    ['Bluetooth Speaker', 'Portable Bluetooth speaker, 10-hour battery.', 49.99, 'https://picsum.photos/seed/b1/400/300'],
    ['LED Monitor', '27-inch 1440p monitor with 144Hz refresh rate.', 229.99, 'https://picsum.photos/seed/m1/400/300']
  ];

  for (const p of sample) stmt.run(p);
  stmt.finalize();

  // Insert a test user with password 'password123' (hashed here is placeholder; real hash will be created below)
  const bcrypt = require('bcrypt');
  bcrypt.hash('password123', 10).then(hash => {
    db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', ['demo@example.com', hash], function(err) {
      if (err) console.error(err);
      else console.log('Created demo user: demo@example.com with password password123');
      db.each('SELECT id, title, price FROM products', (err, row) => {
        if (err) console.error(err);
        else console.log(row.id + ': ' + row.title + ' — $' + row.price);
      });
      db.close();
    });
  }).catch(err => {
    console.error(err);
    db.close();
  });
});