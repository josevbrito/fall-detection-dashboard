---
name: FallGuard Professional IoT
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 260px
  gutter: 24px
  margin-mobile: 16px
  stack-gap: 12px
---

## Brand & Style
The design system focuses on high-stakes reliability and technical precision. Designed for healthcare operators and family monitors, the visual language balances the urgency of emergency response with the analytical depth of an enterprise SaaS platform.

The style is **Modern Corporate**, utilizing a sophisticated dark-themed palette to reduce eye strain during long monitoring shifts. It draws inspiration from high-performance developer tools, utilizing crisp borders, subtle depth, and intentional data density. The emotional response is one of "calm vigilance"—the interface feels steady and professional, ensuring that when an alert (Red) appears, it carries maximum visual weight against the muted navy background.

## Colors
The color architecture is built on a deep navy foundation to provide maximum contrast for status indicators.

- **Foundational Neutrals:** The background uses a deep navy to ground the experience, while surfaces use a slightly lighter tint to establish hierarchy.
- **Accents:** Blue and Cyan are used for interactive elements and standard data streams.
- **Semantic Status:** These colors are reserved strictly for health states. **Red (#f87171)** is exclusively for fall detections and critical hardware failures. **Green (#34d399)** features a CSS animation "glow" for live monitoring states.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy environments. 

- **Hierarchy:** Use `display-lg` for dashboard summaries and `title-sm` for card headings.
- **Data Display:** For numerical values in tables or sensor readings, utilize a monospaced system font (`mono-data`) to ensure tabular alignment and rapid scanning.
- **Portuguese Optimization:** Ensure line-heights are generous enough to accommodate descenders and accents common in Brazilian Portuguese (e.g., ç, ã, ê).

## Layout & Spacing
The layout uses a **fixed-fluid hybrid model**. 

- **Sidebar:** A fixed 260px left vertical navigation houses the primary branding and device groups.
- **Main Content:** A fluid 12-column grid with a 24px gutter. 
- **Density:** Maintain a professional "SaaS density"—elements are packed closely enough to see significant data at a glance, but separated by strict 12px or 24px increments to prevent visual clutter.
- **Breakpoints:** On tablet, the sidebar collapses into a narrow icon-only rail. On mobile, the sidebar moves to a bottom navigation bar or a hamburger menu, and the 12-column grid collapses to a single column with 16px side margins.

## Elevation & Depth
Depth is achieved through **Tonal Layering and Borders** rather than aggressive shadows.

1.  **Level 0 (Base):** `#0b1120` (Background).
2.  **Level 1 (Panels):** `#151c2e` with a 1px solid border of `#2a3550`.
3.  **Level 2 (Modals/Popovers):** Slightly lighter navy with a soft 15% opacity black shadow (20px blur) to lift the element above the monitoring grid.

Interactive elements (buttons, input fields) should use the same 1px border logic, darkening the background slightly on hover to simulate a "pressed" or "active" tactile response.

## Shapes
The design system adopts a **Rounded** aesthetic to soften the clinical nature of healthcare monitoring. 

- **Cards & Panels:** 14px corner radius (`rounded-lg` equivalent).
- **Buttons & Inputs:** 8px corner radius.
- **Status Pills:** Fully pill-shaped (999px) for "Live" indicators and status tags.

## Components

- **Vertical Sidebar:** Features the "🛡️ FallGuard" logo in White (#FFFFFF). Nav items use a ghost style (transparent background) that transitions to a subtle blue tint (#3b82f6 at 10% opacity) on hover.
- **Live Status Pill:** Located in the top bar. Features a 6px circle with a CSS `pulse` animation using the Healthy Green color (#34d399).
- **KPI Stat Cards:** Large `display-lg` numbers. Mini-trend lines (Sparklines) should use 2px stroke widths with a subtle gradient fill below the path.
- **Data Tables:** Row-based. No vertical lines; only subtle horizontal separators (#2a3550). Hovering over a row highlights it with a slightly lighter navy background.
- **Input Fields:** Dark background (#0b1120), 1px border (#2a3550). Focus state transitions the border to Primary Blue (#3b82f6) with a 2px outer glow.
- **Alert Cards:** For active fall detections, the card border color should pulsate between the standard border color and Alert Red (#f87171).