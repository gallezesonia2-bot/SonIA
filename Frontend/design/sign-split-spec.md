Sign Split Spec — SonIA

Overview
- Split-screen authentication card: left = Sign In form, right = Welcome / Sign Up.
- Provide light + dark variants. Use purple gradient as primary brand.

Colors
- SonIA Purple 1: #5B2A9E
- SonIA Purple 2: #7C3AED
- Accent bright purple (dark mode): #9B6CFF
- Light form fill: #F0F0F2
- Light background gradient: linear-gradient(135deg,#f5f0ff 0%, #ffffff 100%)
- Dark background gradient: linear-gradient(180deg,#121212 0%, #1a1a1e 100%)

Typography
- Heading: Inter/Inter-ExtraBold or system sans-serif, 600–800 weight for emphasis.
- Body: Inter 400, 14–16px, high contrast on backgrounds.

Components
- Logo: three overlapping circles SVG, purple gradient, 48px mark above form title.
- Social icons: 4 rounded-square buttons, 36px, subtle border in light mode (#E6E6E6), dark gray squares in dark mode (#2A2A30).
- Inputs: rounded-2xl, fill background, no outer border, placeholder medium gray.
- Primary button: pill, full width on the form side, purple fill (#5B2A9E), white text, 14–16px, bold.
- CTA button on welcome side: transparent, 2px rounded border (white in light, purple glow in dark), uppercase text.

Layout & Spacing
- Card: max-width 1120px, height ~520px, 2 column grid (55% / 45%).
- Inner padding: 40px (desktop), stack vertically on small screens.
- Corner radius: 20–28px.

Blob Shape
- Organic curved blob on right side with left-inward bulge. Use SVG clipPath or CSS clip-path with an SVG path.
- Gradient fill from SonIA Purple 2 to SonIA Purple 1, diagonal direction.

Interaction & Effects
- Dark mode: subtle glow on purple UI elements, slight shadow on primary button.
- Hover states: social icons highlight with faint purple tint; sign-in button darkens slightly.

Export notes for Figma
- Provide 48/64/128 px SVG exports of the logo.
- Provide 2 color styles (Light / Dark) and text styles (H1/H2/Body/Small).
