# Countdown App

A customizable countdown timer application built with Next.js, featuring shareable URLs and real-time updates.

## Features

- 🎯 **No Authentication Required** - Jump straight into creating countdowns
- ⏰ **Two Countdown Types**:
  - Natural Time: 24/7 countdown
  - Working Hours: Count only during specified work hours (excluding weekends optional)
- 🌍 **Timezone Support** - Multiple timezone options
- 🎨 **Full Customization**:
  - Background colors
  - Text and title colors  
  - Font families
  - Font sizes
- 🔗 **Shareable URLs** - Each countdown gets a unique URL to share with others
- ✏️ **Edit & Delete** - Modify or remove countdowns anytime
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

This app is configured for free deployment on Vercel:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy automatically

The app uses SQLite for data storage, which works great for small to medium usage on Vercel's free tier.

## Usage

1. **Create a Countdown**: Fill out the form with your event details, customize the appearance, and click "Create Countdown"
2. **Share**: Copy the generated URL and share it with anyone
3. **Edit**: Use the edit button on the countdown page to modify settings
4. **Delete**: Remove countdowns you no longer need

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite
- **Deployment**: Vercel (free tier)

## API Endpoints

- `POST /api/countdown` - Create a new countdown
- `GET /api/countdown/[id]` - Get countdown by ID
- `PUT /api/countdown/[id]` - Update countdown
- `DELETE /api/countdown/[id]` - Delete countdown
- `GET /api/countdown` - Get all countdowns

## License

MIT License - feel free to use this project for personal or commercial purposes.