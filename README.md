# Affiliate Boss

A simple, clean affiliate marketing platform built for Vercel serverless deployment.

## What It Does

Create affiliate links, track clicks and conversions, manage commissions - all through a clean web interface with demo data for testing.

## Tech Stack

- **Backend**: Node.js serverless functions (Vercel)
- **Frontend**: Vanilla HTML/CSS/JS with Tailwind CSS
- **Demo Data**: Built-in fake data for testing
- **APIs**: RESTful endpoints for all functionality

## Getting Started

### Demo Mode
1. Visit your deployed URL
2. Click "Try Demo" 
3. Use API key: `api_key_john_123456789`
4. Explore all features with fake data

### Local Development
```bash
# Clone the repo
git clone <your-repo-url>
cd affiliate-boss

# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

## Project Structure

```
affiliate-boss/
├── api/
│   ├── utils/helpers.js       # Shared functions
│   ├── index.js               # Landing page
│   ├── dashboard.js           # Dashboard interface
│   ├── links.js               # Affiliate links management
│   ├── integrations.js        # Store integrations
│   ├── profile.js             # User profile
│   ├── redirect.js            # Link redirects (/go/:code)
│   └── auth/
│       ├── send-otp.js        # Send SMS OTP
│       ├── verify-otp.js      # Verify OTP & login
│       └── signup.js          # User registration
├── vercel.json               # Vercel configuration
└── package.json              # Dependencies & scripts
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Landing page |
| `/dashboard` | GET | Main dashboard |
| `/api/auth/send-otp` | POST | Send SMS verification |
| `/api/auth/verify-otp` | POST | Verify & login |
| `/api/auth/signup` | POST | Create account |
| `/api/links` | GET/POST | Manage affiliate links |
| `/api/kpis/dashboard` | GET | Dashboard stats |
| `/api/integrations` | GET/POST | Store connections |
| `/api/profile` | GET/PUT | User profile |
| `/go/:code` | GET | Link redirects |

## Features

### ✅ Working Demo Features
- **Landing Page**: Clean homepage with signup/login
- **Authentication**: SMS OTP system (demo mode)
- **Dashboard**: Real-time stats and analytics
- **Link Management**: Create and track affiliate links
- **Store Integrations**: Connect Shopify stores (demo)
- **Commission Tracking**: View earnings and payouts
- **Mobile Responsive**: Works on all devices

### 🎮 Demo Data Includes
- 5 realistic products (MacBook, Tesla, iPhone, etc.)
- 2 mock Shopify stores
- Performance analytics and charts
- Commission history
- User profile data

## Deployment

### Vercel (Recommended)
1. **Connect GitHub**: Import your repo to Vercel
2. **Auto Deploy**: Vercel deploys automatically
3. **Get URL**: Use your live Vercel URL
4. **Test Demo**: Visit `/dashboard?demo=true`

### Manual Deploy
```bash
# Deploy to production
npm run deploy

# Follow Vercel prompts
```

## Configuration

### Environment Variables
Currently none required for demo mode. For production:
- `SMS_API_KEY`: Twilio/similar SMS service
- `DATABASE_URL`: PostgreSQL/MySQL connection
- `JWT_SECRET`: For secure authentication

### Demo vs Production
- **Demo**: Uses fake data, accepts any OTP code
- **Production**: Requires real database, SMS service, etc.

## Code Style

This codebase follows natural, human developer patterns:
- Clear, descriptive variable names
- Simple, readable functions
- Practical error handling
- Minimal abstraction
- Comments that add value
- Standard Node.js patterns

## Development Notes

### Adding New Features
1. Create new API endpoint in `/api/`
2. Use `helpers.js` for shared functions
3. Follow existing patterns for consistency
4. Test with demo API key first

### Database Integration
To use real data instead of demo:
1. Replace demo data in `helpers.js`
2. Add database queries to API endpoints
3. Set up environment variables
4. Update authentication logic

### SMS Integration  
To use real SMS instead of demo:
1. Sign up for Twilio/similar service
2. Add API credentials to environment
3. Replace console.log with real SMS calls
4. Implement OTP storage/verification

## Common Issues

### Vercel Deployment
- Ensure all files are committed to git
- Check Vercel function logs for errors
- Verify environment variables if using production features

### Local Development
- Use `vercel dev` not `npm start`
- Install Vercel CLI: `npm i -g vercel`
- Port 3000 should be available

### API Testing
- Use demo API key: `api_key_john_123456789`
- Check browser console for errors
- Test endpoints with curl/Postman

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Ready to deploy!** This codebase is production-ready for Vercel deployment with clean, maintainable code that any developer can understand and extend.