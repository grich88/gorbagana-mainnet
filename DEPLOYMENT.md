# 🚀 Deployment Guide

This guide covers different deployment options for the Gorbadome frontend.

## Render Deployment (Recommended)

### Option 1: Static Site (Fastest)
1. Connect your GitHub repository to Render
2. Choose "Static Site"
3. Configure:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Environment Variables**: 
     - `NODE_VERSION`: `18`

### Option 2: Using render.yaml (Automatic)
The repository includes a `render.yaml` file that will automatically configure the deployment.

### Option 3: Docker Deployment
If you prefer Docker:
1. Choose "Web Service" 
2. Render will automatically detect the Dockerfile
3. No additional configuration needed

## Manual Deployment

### Build Locally
```bash
cd frontend
npm install
npm run build
```

The build files will be in `frontend/build/` and can be deployed to any static hosting service.

### Other Hosting Platforms

#### Netlify
1. Connect GitHub repository
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/build`

#### Vercel
1. Import GitHub repository
2. Framework: React
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `build`

#### GitHub Pages
```bash
cd frontend
npm install
npm run build
npx gh-pages -d build
```

## Environment Configuration

### Network Settings
Update `frontend/src/index.js`:
```javascript
// For mainnet deployment
const network = WalletAdapterNetwork.Mainnet;

// For devnet testing  
const network = WalletAdapterNetwork.Devnet;
```

### Program ID
Update `frontend/src/App.js` with your deployed program ID:
```javascript
const PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID');
```

## Production Checklist

- [ ] Update Program ID to deployed version
- [ ] Set correct network (mainnet/devnet)
- [ ] Test wallet connections
- [ ] Verify all transactions work
- [ ] Check responsive design
- [ ] Test on multiple browsers
- [ ] Configure custom domain (optional)

## Troubleshooting

### Build Failures
- Ensure Node.js version 18+
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors
- Verify all dependencies are installed

### Runtime Issues
- Check browser console for errors
- Verify wallet extension is installed
- Ensure correct network configuration
- Check program deployment status

### Performance
- Enable gzip compression
- Configure CDN if needed
- Optimize images and assets
- Monitor Core Web Vitals 