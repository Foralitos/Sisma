# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production (also runs next-sitemap postbuild)
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test runner is configured — API routes are tested manually or via fetch.

## Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS 4** + **DaisyUI 5** — utility-first styling with component classes
- **NextAuth v5 (beta)** — JWT strategy, Google OAuth + Email (Resend) providers
- **MongoDB** + **Mongoose** — ODM with a shared `connectMongo()` connection helper
- **Stripe** — checkout sessions, customer portal, webhooks
- **Resend** — transactional email

## Architecture

### Route Groups
```
app/
  (marketing)/          # Public marketing pages
  (private)/
    (user)/dashboard/   # Protected user dashboard
    admin/dashboard/    # Admin dashboard + user management
  api/
    auth/[...nextauth]/ # NextAuth handler
    stripe/             # create-checkout, create-portal
    webhook/stripe/     # Stripe webhook receiver
    admin/              # Admin CRUD
    lead/               # Lead capture
  blog/                 # Blog with dynamic [articleId] routes
```

### Key Files
- `config.js` — single source of truth for app name, domain, Stripe plans, email addresses, auth URLs, and UI theme
- `libs/auth.js` — NextAuth config with JWT callbacks that embed `role` into the token and refresh it from DB on each session
- `libs/api.js` — Axios client with interceptors: unwraps `response.data`, auto-toasts errors, redirects 401s to login with `callbackUrl`
- `libs/mongoose.js` — `connectMongo()` singleton; call before every DB operation in API routes
- `middleware.js` — NextAuth edge middleware protecting all routes (passes through `/api`, `/_next`, `/favicon.ico`)

### User Model
`models/User.js` stores: `name`, `email`, `image`, `role` (user/admin/editor/moderator), `customerId` (Stripe `cus_*`), `priceId`, `hasAccess`, timestamps. The `toJSON` plugin cleans `__v` and `_id` from API responses.

### Auth Flow
- Protected pages: `const session = await auth()` → redirect to `config.auth.loginUrl` if missing
- Protected API routes: `const session = await auth()` → return 401 if `!session?.user`
- Role is embedded in JWT via the `jwt` callback and refreshed from DB in the `session` callback

### Stripe Flow
1. Client calls `POST /api/stripe/create-checkout` → receives a `url`, redirects
2. After payment, Stripe sends `checkout.session.completed` to `/api/webhook/stripe` → sets `customerId`, `priceId`, `hasAccess = true` on the User
3. On cancellation, `customer.subscription.deleted` → sets `hasAccess = false`
4. `POST /api/stripe/create-portal` → redirects to Stripe billing portal

## Coding Patterns

### Server vs Client Components
Default to Server Components. Add `"use client"` only for interactivity. Never call `connectMongo()` or `auth()` inside client components.

### API Route Structure
```javascript
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.field) return NextResponse.json({ error: "Missing field" }, { status: 400 });

    await connectMongo();
    // business logic
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Mongoose Models
Always export with the guard: `mongoose.models.Name || mongoose.model("Name", schema)`. Apply `schema.plugin(toJSON)`. Add compound indexes for query patterns.

### Client-Side API Calls
Use `apiClient` from `@/libs/api` (not raw fetch). It handles auth redirects and error toasting automatically.

### Imports
Use `@/` absolute imports everywhere (configured in `jsconfig.json`). Never use relative paths.

### Naming
- Components: `PascalCase.js`
- API directories: `kebab-case/route.js`
- Utilities: `camelCase`

### DaisyUI Loading State
```jsx
{isLoading ? <span className="loading loading-spinner loading-xs" /> : "Label"}
```
