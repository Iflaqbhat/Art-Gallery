# Maison Aman — art gallery frontend

A sophisticated art gallery web application inspired by Netflix's user interface, built with React, TypeScript, and Tailwind CSS.

## 🎨 Design Philosophy

This application replicates Netflix's acclaimed streaming interface but reimagined for art discovery and exploration. The design prioritizes visual storytelling, immersive browsing, and seamless content discovery.

## 🏗️ Architecture Overview

### Component Structure
```
src/
├── components/ui/
│   ├── navbar.tsx           # Fixed navigation with glass effect
│   ├── hero-section.tsx     # Full-screen featured artwork display
│   ├── content-row.tsx      # Horizontal scrolling galleries
│   ├── artist-profiles.tsx  # Circular artist avatars
│   ├── footer.tsx          # Multi-column footer links
│   └── [shadcn components] # Button, Card, etc.
├── pages/
│   └── Index.tsx           # Main homepage layout
└── styles/
    └── index.css           # Design system & variables
```

## 🎭 Design System

### Color Palette
- **Primary**: `--primary: 0 100% 50%` (Netflix Red #FF0000)
- **Background**: `--background: 0 0% 8%` (Deep Black #141414)  
- **Cards**: `--card: 0 0% 12%` (Charcoal #1F1F1F)
- **Text**: `--foreground: 0 0% 95%` (Off White)
- **Accents**: `--secondary: 0 0% 15%` (Dark Gray)

### Typography Scale
- **Hero Titles**: 4xl-7xl (72px-96px) - Bold, dramatic impact
- **Section Headers**: 2xl (24px) - Clear hierarchy
- **Card Text**: sm-base (14px-16px) - Readable content
- **Metadata**: xs (12px) - Subtle information

### Spacing System
- **Section Gaps**: 48px vertical rhythm
- **Card Spacing**: 16px horizontal gaps
- **Container Padding**: 16px-32px responsive
- **Component Padding**: 24px internal spacing

## 🎬 Netflix-Inspired UI Patterns

### 1. **Hero Section**
```tsx
// Full viewport immersive display
height: 100vh
background: Large artwork with gradient overlays
overlay: Linear gradients for text readability
content: Featured artwork with metadata & actions
```

**Design Rationale**: Creates immediate visual impact, similar to Netflix's featured content presentation.

### 2. **Horizontal Content Rows**
```tsx
// Scrollable galleries with hover interactions
width: 264px per card (Netflix standard)
spacing: 16px gaps
interaction: 1.05x scale on hover
navigation: Arrow buttons on container hover
```

**Design Rationale**: Enables effortless browsing of large content catalogs without vertical scrolling.

### 3. **Navigation Bar**
```tsx
// Fixed glass-morphism header
position: fixed top-0 with backdrop-blur
background: black/90 with blur effect
logo: Maison Aman wordmark (champagne accent + citadel mark)
layout: Left-aligned nav, right-aligned utilities
```

**Design Rationale**: Maintains branding visibility while preserving content immersion.

## 🎨 Visual Design Decisions

### **Dark Theme Strategy**
- **Primary Background**: Ultra-dark (#141414) reduces eye strain
- **Content Cards**: Slightly lighter (#1F1F1F) creates subtle depth
- **Text Contrast**: High contrast white-on-dark ensures accessibility
- **Red Accents**: Strategic use of Netflix red for calls-to-action

### **Layout Philosophy**
- **Mobile-First**: Responsive design scales from 320px to 2560px
- **Grid Systems**: CSS Grid for page layout, Flexbox for components
- **Aspect Ratios**: 16:9 for artwork cards, maintaining visual consistency
- **Z-Index Management**: Layered depth (navbar: 50, overlays: 10)

### **Interactive Animations**
```css
/* Smooth transitions using cubic-bezier easing */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover effects */
transform: scale(1.05);        /* Card hover growth */
opacity: 0 → 1;               /* Fade-in elements */
backdrop-filter: blur(12px);   /* Glass morphism */
```

## 🔧 Technical Implementation

### **State Management**
- React hooks for component state
- Context API for global state (when needed)
- Local storage for user preferences

### **Performance Optimizations**
- Lazy loading for images
- Horizontal scroll optimization
- CSS transforms over layout changes
- Responsive image loading

### **Accessibility Features**
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast ratios (WCAG AA compliant)
- Screen reader compatibility

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Ultra-wide screens */
```

### Responsive Behavior:
- **Mobile**: Single-column layout, touch-optimized interactions
- **Tablet**: Two-column grids, swipe gestures
- **Desktop**: Full multi-column layout, hover states
- **Ultra-wide**: Maximum content width with centered layout

## 🎯 Component Design Patterns

### **Content Row Pattern**
```tsx
interface ContentRowProps {
  title: string;        // Section heading
  items: ContentItem[]; // Array of artwork objects
}

// Reusable for: Collections, Artists, Trending, etc.
```

### **Card Hover States**
```css
.card:hover {
  transform: scale(1.05);           /* Growth effect */
  box-shadow: 0 8px 30px rgba(...); /* Elevated shadow */
  z-index: 10;                      /* Bring to front */
}
```

### **Button Variants**
- **Primary**: White background, black text (high contrast CTAs)
- **Secondary**: Transparent with border (subtle actions)  
- **Ghost**: No background, hover effects only
- **Icon**: Square buttons for utilities

## 🎨 Content Organization Strategy

### **Information Architecture**
1. **Hero**: Featured/trending artwork
2. **Top Collections**: Curated gallery highlights
3. **Latest Arts**: Recently added pieces
4. **Trending**: Popular discoveries
5. **Private Commission**: Exclusive content
6. **Notable People**: Artist profiles

### **Navigation Strategy**
- **Primary**: Home, Collections, Artists, Exhibitions
- **Secondary**: Search, Notifications, Profile
- **Utility**: Footer links, social media, legal

## 🚀 Development Workflow

### **File Organization**
- **Components**: Reusable UI elements in `/components/ui/`
- **Pages**: Route-specific views in `/pages/`
- **Styles**: Global design system in `index.css`
- **Assets**: Images and media in `/public/`

### **Naming Conventions**
- **Components**: PascalCase (e.g., `HeroSection`)
- **Files**: kebab-case (e.g., `hero-section.tsx`)
- **CSS Classes**: Tailwind utilities + semantic names
- **Variables**: CSS custom properties with `--` prefix

## 📊 Performance Metrics

### **Target Metrics**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s  
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### **Optimization Strategies**
- Image lazy loading and optimization
- Component code splitting
- CSS purging and minification
- CDN delivery for static assets

---

## 🔮 Next Steps: Full-Stack Implementation

### **Backend Requirements**
For login/logout, collections management, artist profiles, and admin dashboard functionality, you'll need:

- **User Authentication**: Login/logout, user sessions, password reset
- **Database Storage**: Artwork metadata, user profiles, collections
- **File Upload**: Admin artwork uploads, image processing
- **API Endpoints**: CRUD operations, search, filtering
- **Admin Dashboard**: Content management, user administration

### **Recommended Tech Stack Extension**
```
Frontend: React + TypeScript (current)
Backend: Supabase (recommended)
Database: PostgreSQL (via Supabase)
Storage: Supabase Storage (images/files)
Auth: Supabase Auth (email/password)
API: Supabase Edge Functions
```

### **Implementation Phases**
1. **Phase 1**: Set up Supabase backend integration
2. **Phase 2**: Implement authentication (login/logout pages)
3. **Phase 3**: Create dynamic collection and artist pages
4. **Phase 4**: Build admin dashboard with upload capabilities
5. **Phase 5**: Add search, filters, and personalization

---

**Built with**: React 18, TypeScript, Tailwind CSS, Vite
**Design System**: Custom Netflix-inspired component library
**Deployment**: Static site optimized for modern browsers

This README serves as both documentation and a comprehensive prompt for extending the application with full-stack capabilities.
