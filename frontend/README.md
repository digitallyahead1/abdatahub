# Frontend Development Guide

## Overview

The AB Data Hub frontend is a modern Next.js application built with TypeScript and Tailwind CSS, designed to provide a premium fintech experience.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:3000`

### Build & Production

```bash
# Build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

---

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (landing)/         # Landing page route group
│   ├── (auth)/            # Auth pages route group
│   ├── dashboard/         # Dashboard routes
│   ├── admin/             # Admin routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/              # Auth components
│   ├── dashboard/         # Dashboard components
│   ├── services/          # Service components
│   ├── wallet/            # Wallet components
│   ├── admin/             # Admin components
│   └── common/            # Reusable components
├── lib/                   # Utilities
│   ├── api.ts             # API client
│   ├── auth.ts            # Auth utilities
│   └── validators.ts      # Form validators
├── types/                 # TypeScript types
├── hooks/                 # Custom React hooks
├── context/               # React Context
├── styles/                # CSS files
│   └── globals.css        # Global styles
├── public/                # Static assets
└── next.config.js         # Next.js config
```

---

## Styling

### Tailwind CSS

Primary styling framework. Configuration in `tailwind.config.ts`:

```tsx
// Use predefined colors
<div className="bg-dark-bg text-silver-light">
  <h1 className="text-primary-blue">Heading</h1>
</div>

// Gradients
<div className="bg-gradient-blue">Gradient</div>

// Glow effects
<div className="glow-blue">Glowing element</div>
```

### Global Styles

Additional styles in `styles/globals.css`:

```css
/* Glass morphism */
.glass { }
.glass-dark { }

/* Buttons */
.btn-primary { }
.btn-outline { }

/* Cards */
.card-gradient { }
```

---

## Components

### Example: Dashboard Card

```tsx
// components/dashboard/WalletCard.tsx
export default function WalletCard() {
  return (
    <div className="card-gradient p-6 rounded-lg">
      <h3 className="text-silver-muted text-sm">Wallet Balance</h3>
      <p className="text-3xl font-bold text-silver-light">₦5,000</p>
    </div>
  )
}
```

### Component Best Practices

- Use TypeScript for all components
- Keep components small and focused
- Use custom hooks for logic
- Pass props with clear types
- Memoize expensive components with `React.memo`

---

## State Management

### React Context

For global app state:

```tsx
// context/AppContext.tsx
export const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Usage
const { user } = useContext(AppContext)
```

### Custom Hooks

Create reusable logic:

```tsx
// hooks/useAuth.ts
export function useAuth() {
  const { user, login, logout } = useContext(AppContext)
  return { user, login, logout }
}
```

---

## API Integration

### API Client

`lib/api.ts` uses Axios:

```tsx
import { api } from '@/lib/api'

// GET request
const { data } = await api.get('/users/profile')

// POST request
const { data } = await api.post('/transactions/data', {
  phoneNumber: '08012345678',
  network: 'mtn',
})
```

### Error Handling

```tsx
try {
  const response = await api.get('/users/profile')
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  }
}
```

---

## Forms & Validation

### React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data) => {
    // Submit form
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  )
}
```

---

## Page Examples

### Landing Page

- Hero section with CTA
- Statistics section
- Services showcase
- Testimonials
- Footer with contact info

### Login Page

- Email/phone input
- Password input
- Remember me checkbox
- Forgot password link
- Registration link

### Dashboard

- Wallet balance card
- Recent transactions
- Quick action buttons
- User profile section
- Referral info

---

## Performance Optimization

### Image Optimization

```tsx
import Image from 'next/image'

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="AB Data Hub"
      width={40}
      height={40}
    />
  )
}
```

### Code Splitting

Use dynamic imports for heavy components:

```tsx
const AdminDashboard = dynamic(() => import('./admin'), {
  loading: () => <Skeleton />,
})
```

### Memoization

```tsx
const PriceCard = React.memo(({ price }: { price: number }) => (
  <div className="card">{price}</div>
))
```

---

## Testing

### Jest Configuration

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Example Test

```tsx
import { render, screen } from '@testing-library/react'
import WalletCard from '@/components/dashboard/WalletCard'

test('renders wallet balance', () => {
  render(<WalletCard />)
  expect(screen.getByText('Wallet Balance')).toBeInTheDocument()
})
```

---

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=AB Data Hub
```

---

## Common Issues & Solutions

### Issue: Styles not applying

**Solution**: Rebuild Tailwind cache

```bash
npm run build
# or restart dev server
```

### Issue: API 401 Unauthorized

**Solution**: Check token expiration and refresh

```tsx
if (error.response?.status === 401) {
  await refreshToken()
  return retryRequest()
}
```

### Issue: Images not loading

**Solution**: Ensure images are in `public/` folder and use correct path

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [TypeScript](https://www.typescriptlang.org)

---

## Support

For issues or questions, refer to:
- GitHub Issues
- Documentation
- Team Slack channel
