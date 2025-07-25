# IP Probe Frontend

React 19 frontend for network analysis dashboard built with Vite 7 and Tailwind CSS 4.

## Environment Configuration

The frontend uses environment variables for configuration. Copy `.env.example` to `.env` and modify the values as needed.

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_DEV_HOST` | Development server host | `localhost` | `0.0.0.0` for all interfaces |
| `VITE_DEV_PORT` | Development server port | `3000` | `8080` |
| `VITE_DEV_OPEN` | Auto-open browser on dev start | `true` | `false` |
| `VITE_API_BASE_URL` | Backend API URL (production) | `http://localhost:3001/api` | `https://api.yourdomain.com` |
| `VITE_BACKEND_URL` | Backend URL for proxy | `http://localhost:3001` | `http://backend:3001` |
| `VITE_APP_TITLE` | Application title | `IP Probe - Network Analysis Dashboard` | Custom title |
| `VITE_APP_DESCRIPTION` | Application description | `Privacy-focused network/IP analyzer` | Custom description |
| `VITE_ENABLE_DEV_TOOLS` | Enable development tools | `true` | `false` |
| `VITE_ENABLE_API_LOGGING` | Enable API request logging | `true` | `false` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000` | `60000` |
| `VITE_HTTPS` | Enable HTTPS in development | `false` | `true` |

### Host Configuration Examples

- **Local development**: `VITE_DEV_HOST=localhost` (default)
- **Docker container**: `VITE_DEV_HOST=0.0.0.0`
- **Network access**: `VITE_DEV_HOST=0.0.0.0` (allows access from other devices)
- **Specific interface**: `VITE_DEV_HOST=192.168.1.100`

### Port Configuration Examples

- **Development**: `VITE_DEV_PORT=3000` (default)
- **Custom port**: `VITE_DEV_PORT=8080`
- **Avoid conflicts**: `VITE_DEV_PORT=3001` (if backend uses 3000)

### API Configuration

In **development**, the frontend uses Vite's proxy to forward `/api` requests to the backend:
```env
VITE_BACKEND_URL=http://localhost:3001
```

In **production**, the frontend makes direct requests to the API:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test
```

## Production Deployment

1. Copy `.env.example` to `.env`
2. Update environment variables for production:
   ```env
   VITE_DEV_HOST=0.0.0.0
   VITE_DEV_PORT=3000
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   VITE_APP_TITLE=Your App Title
   VITE_ENABLE_DEV_TOOLS=false
   VITE_ENABLE_API_LOGGING=false
   VITE_ENABLE_SOURCEMAPS=false
   ```
3. Build and serve the application:
   ```bash
   pnpm build
   pnpm preview
   ```

## Docker Configuration

For Docker deployments, use these environment variables:

```env
# Bind to all interfaces in container
VITE_DEV_HOST=0.0.0.0
VITE_DEV_PORT=3000

# Backend service name in Docker Compose
VITE_BACKEND_URL=http://backend:3001
```

## Features

- **React 19**: Latest React features and performance improvements
- **Vite 7**: Fast build tool with modern defaults
- **Tailwind CSS 4**: Latest utility-first CSS framework
- **TypeScript**: Full type safety
- **React Query**: Powerful data fetching and caching
- **React Router**: Client-side routing
- **Leaflet Maps**: Interactive network visualization
- **Recharts**: Data visualization components

## Environment-Specific Features

### Development
- Hot module replacement
- React Query DevTools
- Detailed API logging
- Source maps enabled
- Auto-open browser

### Production
- Optimized bundles
- Code splitting
- Minified assets
- Service worker support (optional)
- Error tracking integration (optional)
