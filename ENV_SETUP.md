# Environment Variables Setup

This document describes the environment variables needed for the application.

## Frontend (React)

### Required Variables

#### `REACT_APP_API_URL`
- **Description:** Base URL for the backend API
- **Development:** `http://localhost:8080`
- **Production:** `https://api.yourdomain.com`
- **Example:** `REACT_APP_API_URL=http://localhost:8080`

**Note:** React requires the `REACT_APP_` prefix for environment variables to be exposed to the application. These are replaced at build time.

### Setup

1. Create a `.env` file in the `frontend/` directory
2. Add your environment variables:
   ```
   REACT_APP_API_URL=http://localhost:8080
   ```
3. Restart the development server

## Backend (Flask)

### Required Variables

#### `FLASK_ENV`
- **Description:** Flask environment mode
- **Options:** `development` or `production`
- **Default:** `development`
- **Example:** `FLASK_ENV=production`

#### `FLASK_DEBUG`
- **Description:** Enable Flask debug mode
- **Options:** `true` or `false`
- **Default:** `false`
- **Note:** Automatically disabled if `FLASK_ENV=production`
- **Example:** `FLASK_DEBUG=false`

#### `PORT`
- **Description:** Server port number
- **Default:** `8080`
- **Example:** `PORT=8080`

#### `ALLOWED_ORIGINS`
- **Description:** Comma-separated list of allowed CORS origins
- **Default:** `http://localhost:3000`
- **Example:** `ALLOWED_ORIGINS=http://localhost:3000,https://app.yourdomain.com`
- **Security:** In production, specify your frontend domain(s) to prevent CSRF attacks

### Setup

1. Create a `.env` file in the `backend/` directory (or project root)
2. Add your environment variables:
   ```
   FLASK_ENV=development
   FLASK_DEBUG=false
   PORT=8080
   ALLOWED_ORIGINS=http://localhost:3000
   ```
3. Restart the Flask server

## Production Deployment

### Frontend
```bash
REACT_APP_API_URL=https://api.yourdomain.com
```

### Backend
```bash
FLASK_ENV=production
FLASK_DEBUG=false
PORT=8080
ALLOWED_ORIGINS=https://app.yourdomain.com
```

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong, unique values** in production
3. **Restrict CORS origins** to your actual frontend domains
4. **Disable debug mode** in production
5. **Use HTTPS** in production (configure at infrastructure level)
