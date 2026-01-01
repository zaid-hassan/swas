src/
├─ app/
│  ├─ (public)/                        # Marketing & discovery
│  │  ├─ page.tsx                     # Home (first thing client sees)
│  │  ├─ layout.tsx                   # Global layout (NAVBAR HERE)
│  │  ├─ about/
│  │  │  └─ page.tsx
│  │  ├─ contact/
│  │  │  └─ page.tsx
│  │  ├─ collections/
│  │  │  └─ page.tsx
│  │  ├─ search/
│  │  │  └─ page.tsx
│  │  └─ not-found.tsx
│  │
│  ├─ (store)/                         # Shopping flow
│  │  ├─ products/
│  │  │  ├─ page.tsx                  # Product listing
│  │  │  └─ [handle]/
│  │  │     └─ page.tsx               # Product detail
│  │  ├─ cart/
│  │  │  └─ page.tsx
│  │  ├─ checkout/
│  │  │  └─ page.tsx
│  │  └─ layout.tsx                   # Store-specific layout (optional)
│  │
│  ├─ (account)/                       # Auth + user space
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  ├─ register/
│  │  │  └─ page.tsx
│  │  ├─ orders/
│  │  │  └─ page.tsx
│  │  ├─ profile/
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  │
│  ├─ api/                             # Backend glue (minimal)
│  │  ├─ revalidate/
│  │  │  └─ route.ts
│  │  ├─ cart/
│  │  │  └─ route.ts
│  │  └─ health/
│  │     └─ route.ts
│  │
│  ├─ layout.tsx                       # Root layout
│  ├─ globals.css
│  └─ middleware.ts                   # Auth / redirects (future)
│
├─ components/
│  ├─ ui/                              # shadcn components ONLY
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  ├─ dropdown-menu.tsx
│  │  └─ ...
│  │
│  ├─ navigation/
│  │  ├─ navbar.tsx                   # Global navbar
│  │  ├─ mobile-nav.tsx
│  │  └─ footer.tsx
│  │
│  ├─ product/
│  │  ├─ product-card.tsx
│  │  ├─ product-gallery.tsx
│  │  ├─ product-price.tsx
│  │  └─ product-actions.tsx
│  │
│  ├─ cart/
│  │  ├─ cart-drawer.tsx
│  │  ├─ cart-item.tsx
│  │  └─ cart-summary.tsx
│  │
│  ├─ checkout/
│  │  ├─ address-form.tsx
│  │  ├─ payment-form.tsx
│  │  └─ order-review.tsx
│  │
│  └─ common/
│     ├─ container.tsx
│     ├─ section-header.tsx
│     ├─ empty-state.tsx
│     └─ loader.tsx
│
├─ lib/
│  ├─ medusa/
│  │  ├─ client.ts                    # Medusa SDK init
│  │  ├─ products.ts
│  │  ├─ collections.ts
│  │  ├─ cart.ts
│  │  └─ checkout.ts
│  │
│  ├─ config/
│  │  ├─ site.ts                      # Name, logo, SEO defaults
│  │  ├─ navigation.ts                # Navbar links (VERY IMPORTANT)
│  │  └─ env.ts
│  │
│  ├─ utils/
│  │  ├─ format-price.ts
│  │  ├─ cn.ts                        # shadcn helper
│  │  ├─ slug.ts
│  │  └─ debounce.ts
│  │
│  └─ constants/
│     ├─ routes.ts
│     └─ cache.ts
│
├─ hooks/
│  ├─ use-cart.ts
│  ├─ use-auth.ts
│  ├─ use-navbar.ts
│  └─ use-media-query.ts
│
├─ store/                             # Client state (Zustand/Context)
│  ├─ cart-store.ts
│  ├─ auth-store.ts
│  └─ ui-store.ts
│
├─ styles/
│  └─ theme.css                       # Brand theming (jewelry)
│
├─ types/
│  ├─ product.ts
│  ├─ cart.ts
│  └─ medusa.ts
│
├─ public/
│  ├─ images/
│  └─ icons/
│
└─ README.md
