# IP Probe Backend

Express.js backend for IP analysis and network detection.

## Environment Configuration

The backend uses environment variables for configuration. Copy `.env.example` to `.env` and modify the values as needed.

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `HOST` | Host/interface to bind the server to | `localhost` | `0.0.0.0` for all interfaces |
| `PORT` | Port number for the server | `3001` | `8080` |
| `NODE_ENV` | Environment mode | `development` | `production`, `test` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://127.0.0.1:3000` | `https://yourdomain.com` |
| `RATE_LIMIT_MAX` | Max requests per 15-minute window | `1000` (dev), `100` (prod) | `500` |
| `LOG_LEVEL` | Logging level | `info` | `debug`, `warn`, `error` |
| `SECURE_HEADERS` | Enable enhanced security headers | `false` | `true` for production |

### Host Configuration Examples

- **Local development**: `HOST=localhost` (default)
- **Docker container**: `HOST=0.0.0.0` 
- **Specific interface**: `HOST=192.168.1.100`
- **IPv6**: `HOST=::1` (localhost) or `HOST=::` (all interfaces)

### Port Configuration Examples

- **Development**: `PORT=3001` (default)
- **Production**: `PORT=80` or `PORT=443`
- **Custom**: `PORT=8080`

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Production Deployment

1. Copy `.env.example` to `.env`
2. Update environment variables for production:
   ```env
   HOST=0.0.0.0
   PORT=3001
   NODE_ENV=production
   CORS_ORIGINS=https://yourdomain.com
   RATE_LIMIT_MAX=100
   SECURE_HEADERS=true
   ```
3. Build and start the application:
   ```bash
   pnpm build
   pnpm start
   ```

## Health Check

The server provides a health check endpoint at `/health` that returns server status and configuration information.

Example: `http://localhost:3001/health`
