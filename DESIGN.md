# PennyWise visual system

PennyWise uses a warm, light-first identity that keeps financial information calm and legible. The system is implemented as CSS custom properties in `src/index.css` and selected through the `data-theme` attribute managed by `ThemeContext`.

## Palette

| Token | Light value | Purpose |
| --- | --- | --- |
| Page base | `#F5F1E8` | Warm off-white application canvas |
| Raised surface | `#FFFCF5` | Cream-white cards, navigation, forms, and charts |
| Primary blue | `#1F5BBE` | Key actions, focus, navigation, and balance |
| Expense red | `#C72C41` | Expense data, warnings, and restrained emphasis |
| Income gold | `#B7810F` | Income, progress, and premium details |
| Deep ink | `#17233B` | Text and high-contrast financial values |

Dark mode uses navy surfaces and brighter versions of the same blue, red, and gold identity.

## Typography

- **Space Grotesk**: headings, product branding, financial totals, and prominent numbers.
- **Inter**: body copy, tables, forms, captions, and dense financial data.
- Hero/display values use responsive `clamp()` sizing; section headings range from 24–46px, body text from 14–18px, and labels from 11–13px.

## Signature element

A restrained blue-and-gold aurora appears behind the landing hero and authenticated dashboard header. It is the product's only large decorative effect. Other surfaces rely on spacing, typography, subtle gradient edges, and semantic color.

## Motion

- Dashboard summary cards reveal as one short staggered sequence.
- The aurora drifts slowly without blocking interaction.
- Budget and goal progress fills reveal from left to right.
- Cards and buttons use small hover/tap responses.
- `prefers-reduced-motion` reduces all transitions and animations to effectively static presentation.

## Finance semantics

Income, expenses, and balance retain separate colors across cards, charts, and tooltips. Rand values use the shared currency formatter, and color is never the only label identifying a financial series.
