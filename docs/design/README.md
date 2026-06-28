# Design Guidelines - AB Data Hub

## Brand Identity

AB Data Hub is positioned as a **premium, fintech-grade VTU platform** with a focus on security, speed, and reliability.

### Logo Usage
- Use the AB Data Hub logo on all public-facing materials
- Maintain clear space around the logo (minimum 20px)
- Never distort or modify the logo shape
- Ensure adequate contrast against backgrounds

### Brand Colors

**Primary Blue**
- Hex: #007BFF
- RGB: 0, 123, 255
- Usage: Primary CTAs, primary navigation, key elements

**Primary Dark Blue**
- Hex: #0066E8
- RGB: 0, 102, 232
- Usage: Hover states, active states, emphasis

**Accent Glow Blue**
- Hex: #00A8FF
- RGB: 0, 168, 255
- Usage: Highlights, focus states, glowing effects

**Dark Background**
- Hex: #0B0F1A
- RGB: 11, 15, 26
- Usage: Primary background

**Dark Background Secondary**
- Hex: #101827
- RGB: 16, 24, 39
- Usage: Cards, secondary backgrounds, containers

**Silver Light**
- Hex: #F5F7FA
- RGB: 245, 247, 250
- Usage: Text, primary text color

**Silver Muted**
- Hex: #D9DDE4
- RGB: 217, 221, 228
- Usage: Secondary text, borders, subtle elements

### Additional Colors

**Success**
- Hex: #10B981
- Usage: Success messages, completed transactions

**Warning**
- Hex: #F59E0B
- Usage: Warning messages, pending states

**Error**
- Hex: #EF4444
- Usage: Error messages, failed transactions

**Info**
- Hex: #3B82F6
- Usage: Information messages, notifications

---

## Typography

### Font Families

**Poppins** - Display & Headlines
- Bold (700): Large headings, prominent text
- SemiBold (600): Section headings
- Medium (500): Sub-headings
- Regular (400): Body text

**Inter** - Body Text & UI
- Bold (700): Emphasis
- SemiBold (600): Section headers
- Medium (500): Buttons, labels
- Regular (400): Body copy

**Manrope** - Accent & Labels
- Bold (700): Important labels
- SemiBold (600): Badges, tags
- Medium (500): Metadata
- Regular (400): Descriptions

### Font Sizes

| Usage | Size | Weight | Font |
|-------|------|--------|------|
| Display Large | 32px | 700 | Poppins |
| Display Medium | 28px | 700 | Poppins |
| Headline Large | 24px | 700 | Inter |
| Headline Medium | 20px | 600 | Inter |
| Title Large | 18px | 600 | Inter |
| Body Large | 16px | 400 | Inter |
| Body Medium | 14px | 400 | Inter |
| Label Large | 12px | 600 | Manrope |
| Label Small | 10px | 500 | Manrope |

---

## Component Design

### Buttons

**Primary Button**
- Background: Gradient (#007BFF to #0066E8)
- Text: #F5F7FA
- Padding: 12px 24px
- Border Radius: 12px
- Hover: Darker gradient

**Secondary Button**
- Background: Transparent
- Border: 2px #00A8FF
- Text: #00A8FF
- Padding: 12px 24px
- Border Radius: 12px

**Disabled Button**
- Background: #D9DDE4
- Text: #A0A4AA
- Cursor: Not allowed

### Cards

**Card Base**
- Background: Dark gradient or glass effect
- Border: 1px rgba(217, 221, 228, 0.1)
- Border Radius: 12px-16px
- Padding: 20px-24px
- Box Shadow: Subtle (0 2px 8px rgba(0,0,0,0.3))

**Card Hover**
- Elevation increase
- Border opacity increase
- Slight scale (1.02)

### Input Fields

**Text Input**
- Background: #101827
- Border: 1px #D9DDE4
- Text Color: #F5F7FA
- Focus Border: 2px #007BFF
- Padding: 12px 16px
- Border Radius: 12px

**Error State**
- Border Color: #EF4444
- Error Text: #EF4444 (12px, below field)

### Navigation

**Top Navigation**
- Background: #0B0F1A
- Height: 64px
- Content: Logo (left), menu items (center), user profile (right)

**Bottom Navigation (Mobile)**
- Background: #101827
- Height: 64px
- Icons: 24px
- Labels: 10px, Manrope
- Active: #00A8FF, inactive: #D9DDE4

### Modals & Dialogs

**Modal Backdrop**
- Background: rgba(0, 0, 0, 0.6)

**Modal Window**
- Background: #101827
- Border Radius: 16px
- Padding: 24px
- Max Width: 500px (desktop), 90vw (mobile)

---

## Effects & Animations

### Glassmorphism

```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
border: 1px rgba(255, 255, 255, 0.2);
```

### Glow Effect

```css
box-shadow: 0 0 20px rgba(0, 168, 255, 0.3);
```

### Smooth Transitions

All interactive elements should have:
- Transition duration: 200ms
- Easing: ease-in-out

### Loading Animation

Shimmer effect with gradient animation cycling 1.5s.

---

## Responsive Design

### Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Mobile | < 640px | Single column |
| Tablet | 640px - 1024px | 2 columns |
| Desktop | > 1024px | 3+ columns |

### Mobile Optimizations

- Touch targets: Minimum 44px × 44px
- Font sizes: 16px minimum (prevents zoom)
- Margins: 16px-20px
- Full-width buttons on mobile

---

## Dark Mode

The platform uses **dark mode as primary theme**:

- Background: #0B0F1A
- Surface: #101827
- Text: #F5F7FA
- Borders: Subtle white with low opacity

**Advantages:**
- Reduced eye strain
- Premium feel
- Battery efficient on OLED devices
- Fits fintech aesthetic

---

## Accessibility

### Color Contrast

- Normal text: 4.5:1 minimum contrast ratio
- Large text: 3:1 minimum contrast ratio

### Focus States

All interactive elements must have visible focus indicator:

```css
outline: 2px solid #007BFF;
outline-offset: 2px;
```

### Icons & Images

- Include `alt` text for all images
- Use semantic HTML
- Test with screen readers

---

## Animation Guidelines

### Transitions

| Action | Duration | Easing |
|--------|----------|--------|
| Hover states | 200ms | ease-out |
| Modal open/close | 300ms | ease-in-out |
| Page transitions | 400ms | ease-in-out |
| Loading states | 1.5s | linear (loop) |

### Motion Preferences

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Spacing

Use 4px base unit:

```
4px   = xs
8px   = sm
12px  = md
16px  = lg
20px  = xl
24px  = 2xl
32px  = 3xl
```

---

## Shadow System

| Level | Shadow | Usage |
|-------|--------|-------|
| 1 | 0 1px 3px rgba(0,0,0,0.12) | Subtle elevation |
| 2 | 0 2px 8px rgba(0,0,0,0.15) | Cards, default |
| 3 | 0 4px 16px rgba(0,0,0,0.20) | Modals, popovers |
| 4 | 0 8px 24px rgba(0,0,0,0.25) | Floating elements |

---

## Fintech Design Inspiration

Design patterns inspired by top Nigerian fintech apps:

- **Opay**: Smooth transitions, card-based layouts
- **PalmPay**: Bold typography, clear hierarchy
- **Moniepoint**: Trust signals, security indicators
- **Kuda**: Minimalist design, quick actions
- **Paystack**: Professional, credible appearance

---

## Design Checklist

- [ ] Brand colors used consistently
- [ ] Typography hierarchy clear
- [ ] Component spacing consistent
- [ ] Mobile responsive
- [ ] Dark mode compatible
- [ ] Accessibility requirements met
- [ ] Focus states visible
- [ ] Loading states present
- [ ] Error states clear
- [ ] Animation smooth and purposeful
