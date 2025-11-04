# Event Portal – Project Overview

## 🎯 What this project does
- **Discover events** across departments with search and filters
- **View details** with breadcrumbs, countdown, FAQ, similar events
- **Register and pay** securely; receipts and certificates supported
- **Manage** registrations and events with admin tools

---

## 👤 User Journey (High-level)
```mermaid
flowchart TD
  A[Visitor lands on Home] --> B{Explore events?}
  B -- Yes --> C[Explore/ExploreEvents]
  C -->|Search/Filter| C
  C --> D[Event Details]
  D --> E{Upcoming?}
  E -- Yes --> F[Countdown + Add to Calendar]
  E -- No --> G[Ended (no registration)]
  D --> H[Share Event]
  D --> I[Similar Events]
  D --> J{Register?}
  J -- Yes --> K[Payment Checkout]
  K --> L{Success?}
  L -- Yes --> M[Payment Success + My Events]
  L -- No --> N[Payment Cancel]
  M --> O[Certificate (post-event)]
  A --> P[Auth/Login]
  P --> M
```

---

## 🏗️ System Architecture (Simplified)
```mermaid
flowchart LR
  subgraph Client[Frontend (React)]
    UI[Pages & Components\n(Home, Explore, EventDetails, Payment, MyEvents)]
    Search[SearchBar]
    Share[ShareButtons]
    FAQ[EventFAQ]
    Counter[AnimatedCounter]
  end

  subgraph API[Backend (Express + MongoDB)]
    Auth[/api/auth]
    Events[/api/events]
    Regs[/api/registrations]
    Feedback[/api/feedback]
    Upload[/api/upload]
    Webhook[/api/registrations/webhook\n(Stripe webhook)]
  end

  DB[(MongoDB)]
  Stripe[(Payment Gateway)]

  UI -->|REST| Auth
  UI -->|REST| Events
  UI -->|REST| Regs
  UI -->|REST| Feedback
  UI -->|REST| Upload

  Auth --- DB
  Events --- DB
  Regs --- DB
  Feedback --- DB

  Regs -->|Create checkout session| Stripe
  Stripe -->|Webhook events| Webhook
  Webhook -->|Update paymentStatus\n& dispatch certificates| DB

```

---

## 📦 Key Modules
- **Frontend**: `frontend/src/pages/*`, `frontend/src/components/*`
- **Backend**: `backend/server.js`, routes under `backend/routes/*`
- **Data**: MongoDB models (Users, Events, Registrations, Payments)

---

## 🔑 Notable Features
- Breadcrumbs, sharing, countdown, add-to-calendar, FAQ, similar events
- Debounced search with top results preview
- Professional payment flow with trust indicators
- Admin: events, registrations, department requests

---

## 🚀 How to use this file
- View directly in editors that support Mermaid
- Or paste the diagrams into https://mermaid.live to export PNG/SVG
