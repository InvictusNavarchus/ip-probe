# IP Probe - Privacy-Focused Network/IP Analyzer

A production-ready, privacy-focused full-stack web application that analyzes and identifies comprehensive network and IP information from client connections without relying on third-party services.

## Features

### 🔍 Comprehensive IP Analysis
- **Multi-source IP Detection**: X-Forwarded-For, X-Real-IP, CF-Connecting-IP, and socket analysis
- **IP Classification**: IPv4/IPv6, public/private/reserved ranges identification
- **Network Range Analysis**: CIDR notation and subnet calculations
- **Connection Type Detection**: Residential, business, mobile, hosting identification

### 🌍 Privacy-First Geolocation
- **Local Database Processing**: Built-in IP-to-location mapping without external APIs
- **Geographic Information**: Country, region, city, and timezone detection
- **ISP/Organization Identification**: Using local threat intelligence databases
- **No Data Retention**: Real-time analysis without storing visitor data

### 🔒 Network Security Assessment
- **TCP/IP Stack Fingerprinting**: Operating system detection through network behavior
- **Connection Analysis**: Protocol analysis (HTTP/HTTPS/WebSocket)
- **TLS/SSL Information**: Certificate details and security assessment
- **Network Performance**: Latency estimation and connection quality metrics

### 🎨 Modern User Interface
- **React 19**: Latest features with concurrent rendering and new hooks
- **Tailwind CSS 4**: CSS-first configuration with OKLCH colors and container queries
- **Responsive Design**: Mobile-first approach with dark/light mode support
- **Real-time Updates**: Live data refresh without page reload
- **Interactive Visualizations**: Network topology diagrams and geographic maps

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Frontend**: React 19 + Tailwind CSS 4 + Vite 7
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode, no 'any' types)
- **Testing**: Jest + React Testing Library
- **Deployment**: Docker containerization ready

## Quick Start

### Prerequisites
- Node.js 20.19+ or 22.12+
- pnpm 9.0+

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd ip-probe

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Development
```bash
# Start both frontend and backend in development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
ip-probe/
├── packages/
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── package.json
│   └── frontend/         # React 19 application
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── types/
│       │   └── utils/
│       └── package.json
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── README.md
```

## Privacy & Security

- **No External Dependencies**: All IP analysis performed locally
- **Data Minimization**: Collect only necessary network information
- **Secure Communication**: HTTPS enforcement with security headers
- **Input Validation**: Comprehensive sanitization of all inputs
- **GDPR Compliance**: Privacy-by-design architecture
- **Rate Limiting**: Built-in protection against abuse

## Performance

- **Sub-second Response Times**: Optimized for instant analysis
- **Local Processing**: No external API calls for core functionality
- **Efficient Caching**: Intelligent caching for IP database lookups
- **Bundle Optimization**: Tree-shaking and code splitting
- **Memory Management**: Minimal resource usage

## License

This project is unlicensed and provided as-is for educational and development purposes.

## Contributing

Please ensure all contributions follow the established code style and include appropriate tests.
