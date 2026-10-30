# SaoudaShop

Online Store for baby cereals.

## Add a testimonial

Edit `data/testimonials.json`. One per delivery feedback you may quote, after
asking the customer's permission:

```json
[
  {
    "text": "La boîte est arrivée ce soir, bébé adore 😊",
    "name": "Marlène",
    "city": "Douala"
  }
]
```

Or bilingual, used by the seeded draft quotes:

```json
[
  {
    "text": { "fr": "…", "en": "…" },
    "name": "Marlène",
    "city": "Douala"
  }
]
```

The "What parents say" section shows on the site only when this file has at
least one entry. Never include phone numbers or full names.

