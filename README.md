# Amazon-clone (Upgraded)

Includes:
- Express backend with authentication (register/login using bcrypt + JWT)
- SQLite database (users, products, carts)
- React (Vite) frontend (basic)
- Docker + docker-compose for easy startup

## Quick start (local, without Docker)

### Server
```bash
cd server
npm install
npm run seed   # creates data/store.db and a demo user (demo@example.com / password123)
npm start
```
Server will run on http://localhost:5000 and serve API and built client when available.

### Client (development)
```bash
cd client
npm install
npm run dev
```
Dev server runs on http://localhost:5173 and proxies requests to `/api` to the server (when built and served together you may need to adjust proxy settings).

## Using Docker (recommended simple run)
Make sure Docker is installed. From project root:
```bash
docker-compose up --build
```
- Server: http://localhost:5000
- Client (static build served by nginx): http://localhost:5173

## Demo credentials
- Email: demo@example.com
- Password: password123

Notes:
- CHANGE the JWT_SECRET in .env or docker-compose for real use.
- This is still a demo: no email verification, no payment processing, and minimal validation.# amazon-web-clo
