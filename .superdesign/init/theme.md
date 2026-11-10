# Design Tokens & Theme Specification (Stripe Design System)

## Color Tokens

```css
:root {
  /* Core Foundation */
  --stripe-white: #FFFFFF;
  --stripe-mist: #F8FAFD;
  --stripe-mist-soft: #FCFDFE;
  --stripe-ink: #061B31;
  --stripe-text: #30313D;

  /* Brand and Primary Accents */
  --stripe-violet: #635BFF;
  --stripe-violet-bright: #533AFD;
  --stripe-violet-deep: #7232F1;
  --stripe-indigo: #1318C1;
  --stripe-blue: #0073E6;
  --stripe-elements-blue: #0570DE;

  /* Support Palette */
  --stripe-success: #00D66F;
  --stripe-orange: #FF6118;
  --stripe-pink: #FB76FA;
  --stripe-yellow: #FFCF5E;
  --stripe-danger: #DF1B41;

  /* Surface & Border Scale */
  --surface-50: #FAFDFF;
  --surface-100: #F6F9FC;
  --surface-200: #ECF0F4;
  --border-soft: #E3ECF7;
  --border-mid: #D4DEE9;
  --text-muted: #737373;

  /* Dark / Ink Scale */
  --ink-900: #061B31;
  --ink-800: #1C1E54;
  --ink-700: #2B408A;
  --ink-600: #453BB3;
  --text-on-dark: #FFFFFF;

  /* Elevation Shadows */
  --shadow-sm: 0 8px 20px rgba(13, 23, 56, 0.12);
  --shadow-md: 0 18px 40px rgba(13, 23, 56, 0.15);
  --shadow-lg: 0 28px 60px rgba(13, 23, 56, 0.18);
  --shadow-focus: 0 0 0 3px rgba(5, 112, 222, 0.2);
}
```

## Typography
- Primary Sans: `'Sohne', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`
- Monospace: `'Source Code Pro', 'SF Mono', 'JetBrains Mono', Menlo, monospace`
- Scale: Hero Display 64px (600, -0.04em), Page Title 44px (600, -0.03em), Section Title 32px (600, -0.02em), Card Title 24px (500, -0.015em), Body 16px (400, 1.6).

## Components
- Primary Button: Height 44px, background `#533AFD`, hover `#635BFF`, pill `rounded-full` (999px), shadow `0 8px 20px rgba(83, 58, 253, 0.24)`.
- Secondary Button: Height 44px, background `#FFFFFF`, border `1px solid #D4DEE9`, color `#061B31`, hover `#F8FAFD`, pill `rounded-full`.
- Cards: Background `#FFFFFF`, border `1px solid rgba(212, 222, 233, 0.75)`, radius `18px`, shadow `0 18px 40px rgba(13, 23, 56, 0.15)`.
- Inputs: Background `#FFFFFF`, border `1px solid #D4DEE9`, radius `4px`, padding `12px`, focus border `#0570DE`, focus ring `0 0 0 1px #0570DE`.

