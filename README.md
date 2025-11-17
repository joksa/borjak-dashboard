# Business Dashboard

A modern, full-stack Next.js application with authentication, dashboard, and theme switching.

## Features

- **Next.js 16** with App Router
- **Tailwind CSS 4** with custom soft-pop theme
- **shadcn/ui** components
- **Light/Dark theme** switching
- **Responsive design** - mobile-friendly
- **Authentication flow** with email and OTP
- **Dashboard layout** with collapsible sidebar
- **SPA-style routing** within dashboard

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Login

- **Email**: admin@admin.com
- **OTP**: 123456

The login flow consists of:
1. Enter email address
2. Click "Continue" to receive OTP fields
3. Enter the 6-digit OTP code
4. Click "Verify" to access the dashboard

### Dashboard

The dashboard includes:
- **Statistics cards** showing business metrics
- **Collapsible sidebar** with navigation menu
- **Header** with theme toggle and user profile
- **Responsive layout** that works on all screen sizes

### Theme Switching

Use the theme toggle in the header to switch between:
- Light mode
- Dark mode
- System preference

## Email Functionality

The application includes a complete email sending system with the following features:

### Features
- Send emails with text content
- Attach multiple files (PDF, Word, Excel, PowerPoint, Images, ZIP, etc.)
- File type and size validation
- Real-time form validation
- Success/error feedback
- SMTP configuration for various providers

### Setup

1. **Install Dependencies** (already done):
   ```bash
   npm install nodemailer @types/nodemailer
   ```

2. **Configure Environment Variables** in `.env.local`:
   ```env
   # SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Your Name
   ```

3. **Gmail Setup** (if using Gmail):
   - Enable 2-Factor Authentication
   - Generate an App Password in Google Account settings
   - Use the App Password as `SMTP_PASS`

### API Usage

The email system provides both client-side and server-side functions:

```typescript
// Client-side usage
import { sendEmail } from '@/lib/email'

const result = await sendEmail({
  to: 'recipient@example.com',
  subject: 'Hello World',
  text: 'Email content',
  attachments: [file1, file2] // optional
})

// Server-side usage
import { sendEmail } from '@/app/api/send-email/route'

await sendEmail({
  to: 'recipient@example.com',
  subject: 'Hello World',
  text: 'Email content',
  attachments: attachments
})
```

### Supported File Types
- PDF documents
- Microsoft Office files (Word, Excel, PowerPoint)
- Text files and CSV
- Images (JPEG, PNG, GIF, WebP)
- ZIP and RAR archives

**Maximum file size**: 25MB per file

## Tech Stack

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with soft-pop theme
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **State Management**: React hooks
- **Email**: Nodemailer with SMTP

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx    # Dashboard layout with sidebar
│   │   └── page.tsx      # Main dashboard page
│   ├── globals.css       # Global styles and theme variables
│   ├── layout.tsx        # Root layout with theme provider
│   └── page.tsx          # Login page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── app-sidebar.tsx   # Sidebar navigation
│   ├── dashboard-header.tsx # Header with theme toggle
│   ├── login-form.tsx    # Login form component
│   └── theme-toggle.tsx  # Theme switcher
└── lib/
    ├── theme-provider.tsx # Theme context provider
    └── utils.ts          # Utility functions
```

## Customization

### Adding New Dashboard Pages

1. Create a new file in `src/app/dashboard/`
2. The layout will automatically wrap it with the sidebar
3. Add navigation items in `src/components/app-sidebar.tsx`

### Modifying Themes

The application uses CSS custom properties defined in `globals.css`. Both light and dark themes are configured there.

### Adding New UI Components

Use shadcn/ui to add new components:

```bash
npx shadcn@latest add [component-name]
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Mobile Development

The application is fully responsive and optimized for mobile devices. All components use responsive classes and the sidebar collapses on smaller screens.