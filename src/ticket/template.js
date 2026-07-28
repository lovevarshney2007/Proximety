/**
 * template.js
 *
 * Responsible for: The reusable ticket template definition.
 *
 * This module contains every STATIC visual element of the ticket:
 *   - Dark background with ticket shape (notched cut-outs on left and right)
 *   - Spider-web artwork (SVG-native drawing — no external image dependency)
 *   - GDG branding block (logo image + text)
 *   - "REGISTRATION CONFIRMED" heading with dramatic red styling
 *   - Spider decoration elements
 *   - QR code placeholder region with red corner-bracket frame
 *   - "SCAN FOR ENTRY" label
 *   - Name / Student ID / Event info placeholders
 *   - Bottom accent line
 *   - Spider-Man character art placeholder (bottom-right)
 *
 * To change the ticket's visual design, edit ONLY this file.
 * The rendering pipeline (renderTicket.js) does not need to change.
 *
 * @param {object} data
 * @param {string} data.name            - Participant full name (UPPERCASE recommended)
 * @param {string} data.studentNumber   - Student ID / Registration ID
 * @param {string} data.venue           - Event venue string
 * @param {string} data.date            - Event date string
 * @param {string} data.time            - Event time string
 * @param {string} data.qrDataUri       - Base64 PNG data URI of the generated QR code
 * @param {string} data.spiderManUri    - Base64 PNG data URI of the Spider-Man art
 * @param {string} data.gdgLogoUri      - Base64 PNG data URI of the GDG logo
 * @param {string} data.spiderWebUri    - Base64 PNG data URI of the spider-web texture
 *
 * @returns {string} Complete SVG document string ready for rasterization.
 */
export function buildTicketSVG(data) {
  const {
    name,
    studentNumber,
    venue,
    date,
    time,
    qrDataUri,
    spiderManUri,
    gdgLogoUri,
    spiderWebUri,
  } = data;

  // ── Canvas dimensions ────────────────────────────────────────────
  const W = 1100;   // Total ticket width  (px at 96 dpi)
  const H = 440;    // Total ticket height

  // Notch geometry — the circular bite taken out of left and right edges
  const notchR = 32;
  const notchY = H / 2;

  // ── Ticket outline path (rect with rounded corners + left+right notches) ─
  //
  // We draw a standard rounded rectangle path and then subtract the two
  // semi-circle notches using SVG clip-path trick (filled white circles
  // placed on top of the notch edges).
  //
  const cr = 18; // corner radius

  // Helper to escape SVG text content
  const esc = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Visible name — uppercase for the ticket style
  const displayName = esc(String(name || "PARTICIPANT").toUpperCase());
  const displayId   = esc(String(studentNumber || "—"));
  const displayVenue = esc(String(venue  || "Venue TBD"));
  const displayDate  = esc(String(date   || "TBD"));
  const displayTime  = esc(String(time   || "TBD"));

  // ── QR section geometry ──────────────────────────────────────────
  const qrX = 58;          // QR block left x
  const qrY = 130;         // QR block top y
  const qrSize = 190;      // QR image size
  const bracketT = 3;      // Corner bracket stroke width
  const bracketL = 20;     // Corner bracket arm length
  const bracketGap = 6;    // Gap between QR image edge and bracket corners

  const bx = qrX - bracketGap;
  const by = qrY - bracketGap;
  const bw = qrSize + bracketGap * 2;
  const bh = qrSize + bracketGap * 2;

  // ── Divider line X (separates QR left column from info right column) ──
  const divX = 318;

  // ── Spider-web SVG paths ─────────────────────────────────────────
  // If a raster web image is provided we use it; otherwise we synthesise
  // a lightweight SVG web pattern so the template has zero asset dependency.
  const webSection = spiderWebUri
    ? `<image href="${spiderWebUri}" x="0" y="0" width="${W}" height="${H}" opacity="0.22" preserveAspectRatio="xMidYMid slice"/>`
    : buildSVGWeb(W, H);

  // ── SVG Spider icon (bullet decorator to the left of the name) ──────
  // Position: vertically centred at y=238 (name baseline), x = left edge of right column + 20px margin
  const spiderIconX = divX + 28;
  const spiderIconY = 220;
  const spiderIcon = `
    <g transform="translate(${spiderIconX}, ${spiderIconY})">
      <!-- body -->
      <ellipse cx="0" cy="0" rx="9" ry="11" fill="#1a0000" stroke="#8B0000" stroke-width="1"/>
      <!-- head -->
      <ellipse cx="0" cy="-17" rx="7" ry="7" fill="#1a0000" stroke="#8B0000" stroke-width="1"/>
      <!-- eyes -->
      <circle cx="-3" cy="-18" r="2" fill="#ff2222"/>
      <circle cx="3"  cy="-18" r="2" fill="#ff2222"/>
      <!-- legs left -->
      <line x1="-9" y1="-5"  x2="-28" y2="-16" stroke="#8B0000" stroke-width="1.5"/>
      <line x1="-9" y1="0"   x2="-28" y2="0"   stroke="#8B0000" stroke-width="1.5"/>
      <line x1="-9" y1="5"   x2="-28" y2="14"  stroke="#8B0000" stroke-width="1.5"/>
      <line x1="-9" y1="9"   x2="-24" y2="22"  stroke="#8B0000" stroke-width="1.5"/>
      <!-- legs right -->
      <line x1="9"  y1="-5"  x2="28"  y2="-16" stroke="#8B0000" stroke-width="1.5"/>
      <line x1="9"  y1="0"   x2="28"  y2="0"   stroke="#8B0000" stroke-width="1.5"/>
      <line x1="9"  y1="5"   x2="28"  y2="14"  stroke="#8B0000" stroke-width="1.5"/>
      <line x1="9"  y1="9"   x2="24"  y2="22"  stroke="#8B0000" stroke-width="1.5"/>
    </g>`;

  // ── Corner spider (top-right decoration) ─────────────────────────
  const cornerSpider = `
    <g transform="translate(${W - 54}, 44) scale(1.4)">
      <ellipse cx="0" cy="0" rx="8" ry="10" fill="#111" stroke="#666" stroke-width="0.8"/>
      <ellipse cx="0" cy="-14" rx="6" ry="6" fill="#111" stroke="#666" stroke-width="0.8"/>
      <circle cx="-2.5" cy="-15" r="1.8" fill="#999"/>
      <circle cx="2.5"  cy="-15" r="1.8" fill="#999"/>
      <line x1="-8" y1="-4"  x2="-24" y2="-13" stroke="#555" stroke-width="1.2"/>
      <line x1="-8" y1="0"   x2="-24" y2="0"   stroke="#555" stroke-width="1.2"/>
      <line x1="-8" y1="4"   x2="-24" y2="12"  stroke="#555" stroke-width="1.2"/>
      <line x1="8"  y1="-4"  x2="24"  y2="-13" stroke="#555" stroke-width="1.2"/>
      <line x1="8"  y1="0"   x2="24"  y2="0"   stroke="#555" stroke-width="1.2"/>
      <line x1="8"  y1="4"   x2="24"  y2="12"  stroke="#555" stroke-width="1.2"/>
    </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">

  <defs>
    <!-- Ticket shape clip — rounded rect with notch cut-outs via mask -->
    <clipPath id="ticketClip">
      <path d="
        M ${cr},0
        H ${W - cr} Q ${W},0 ${W},${cr}
        V ${notchY - notchR}
        A ${notchR},${notchR} 0 0,1 ${W},${notchY + notchR}
        V ${H - cr} Q ${W},${H} ${W - cr},${H}
        H ${cr} Q 0,${H} 0,${H - cr}
        V ${notchY + notchR}
        A ${notchR},${notchR} 0 0,1 0,${notchY - notchR}
        V ${cr} Q 0,0 ${cr},0
        Z
      "/>
    </clipPath>

    <!-- Glowing red text filter for the heading -->
    <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0.7
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0.8 0" result="redBlur"/>
      <feMerge>
        <feMergeNode in="redBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Drop shadow for QR code -->
    <filter id="qrShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/>
    </filter>

    <!-- Subtle inner glow on ticket body -->
    <radialGradient id="bodyGrad" cx="60%" cy="50%" r="70%">
      <stop offset="0%"   stop-color="#0d1728"/>
      <stop offset="100%" stop-color="#060c18"/>
    </radialGradient>

    <!-- Gold gradient for name text -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#FFD700"/>
      <stop offset="50%"  stop-color="#FFC107"/>
      <stop offset="100%" stop-color="#FF9800"/>
    </linearGradient>

    <!-- Separator line gradient -->
    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#8B0000"/>
      <stop offset="40%"  stop-color="#CC0000"/>
      <stop offset="100%" stop-color="#8B0000"/>
    </linearGradient>
  </defs>

  <!-- ── Ticket body ───────────────────────────────────────────── -->
  <g clip-path="url(#ticketClip)">

    <!-- Background fill -->
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bodyGrad)"/>

    <!-- Spider-web texture -->
    ${webSection}

    <!-- Subtle vignette overlay -->
    <rect x="0" y="0" width="${W}" height="${H}"
          fill="none"
          style="filter:url(#none)"
          opacity="0"/>

    <!-- ── TOP SECTION ─────────────────────────────────────────── -->

    <!-- Top header bar (dark, semi-transparent) -->
    <rect x="0" y="0" width="${W}" height="100"
          fill="rgba(0,0,0,0.45)"/>

    <!-- GDG Logo (top-left) — white BG removed in renderTicket.js -->
    ${gdgLogoUri
      ? `<image href="${gdgLogoUri}" x="22" y="10" width="72" height="72"
               preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="22" y="55" font-size="13" fill="#4285F4" font-family="Arial, sans-serif" font-weight="bold">GDG</text>`
    }

    <!-- GDG text block -->
    <text x="100" y="42"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="13" font-weight="bold" fill="#FFFFFF">Google Developer Groups</text>
    <text x="100" y="58"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="10" fill="#AAAAAA">on campus Ajay Kumar Garg Engineering College</text>

    <!-- "REGISTRATION CONFIRMED" heading -->
    <text x="${W - 72}" y="62"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="46" font-weight="900" font-style="italic"
          fill="#CC0000"
          filter="url(#redGlow)"
          text-anchor="end"
          letter-spacing="3">REGISTRATION</text>
    <text x="${W - 72}" y="96"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="40" font-weight="900" font-style="italic"
          fill="#CC0000"
          filter="url(#redGlow)"
          text-anchor="end"
          letter-spacing="5">CONFIRMED</text>

    <!-- Corner spider (top-right) -->
    ${cornerSpider}

    <!-- ── DIVIDER LINE (vertical, separates QR and info) ─────── -->
    <line x1="${divX}" y1="110" x2="${divX}" y2="${H - 60}"
          stroke="rgba(255,255,255,0.12)" stroke-width="1.5"
          stroke-dasharray="6 4"/>

    <!-- ── LEFT COLUMN — QR CODE ──────────────────────────────── -->

    <!-- QR image -->
    <image href="${qrDataUri}"
           x="${qrX}" y="${qrY}"
           width="${qrSize}" height="${qrSize}"
           filter="url(#qrShadow)"
           preserveAspectRatio="xMidYMid meet"/>

    <!-- QR corner brackets (red) -->
    <!-- Top-left -->
    <polyline points="${bx + bracketL},${by} ${bx},${by} ${bx},${by + bracketL}"
              fill="none" stroke="#CC0000" stroke-width="${bracketT}" stroke-linecap="square"/>
    <!-- Top-right -->
    <polyline points="${bx + bw - bracketL},${by} ${bx + bw},${by} ${bx + bw},${by + bracketL}"
              fill="none" stroke="#CC0000" stroke-width="${bracketT}" stroke-linecap="square"/>
    <!-- Bottom-left -->
    <polyline points="${bx},${by + bh - bracketL} ${bx},${by + bh} ${bx + bracketL},${by + bh}"
              fill="none" stroke="#CC0000" stroke-width="${bracketT}" stroke-linecap="square"/>
    <!-- Bottom-right -->
    <polyline points="${bx + bw},${by + bh - bracketL} ${bx + bw},${by + bh} ${bx + bw - bracketL},${by + bh}"
              fill="none" stroke="#CC0000" stroke-width="${bracketT}" stroke-linecap="square"/>

    <!-- "SCAN FOR ENTRY" label -->
    <text x="${qrX + qrSize / 2}" y="${qrY + qrSize + bracketGap + 26}"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="15" font-weight="bold" fill="#00CC66"
          text-anchor="middle" letter-spacing="2">SCAN FOR ENTRY</text>

    <!-- ── RIGHT COLUMN — PARTICIPANT INFO ────────────────────── -->

    <!-- Spider icon — positioned to the left of the name as a bullet/decorator -->
    ${spiderIcon}

    <!-- Participant NAME —— centred in right column -->
    <text x="${Math.round((divX + W) / 2)}" y="238"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="50" font-weight="900"
          fill="url(#goldGrad)"
          text-anchor="middle"
          letter-spacing="3">
      ${displayName}
    </text>

    <!-- Student ID / Registration ID -->
    <text x="${Math.round((divX + W) / 2)}" y="290"
          font-family="'DejaVu Sans Mono', 'Liberation Mono', 'Courier New', monospace"
          font-size="32" font-weight="bold"
          fill="url(#goldGrad)"
          text-anchor="middle"
          letter-spacing="4">
      ${displayId}
    </text>

    <!-- Thin separator line above event info -->
    <line x1="${divX + 20}" y1="316" x2="${W - 20}" y2="316"
          stroke="rgba(200,0,0,0.55)" stroke-width="1.5"/>

    <!-- Event info — 2 rows: Venue on first, Date+Time on second -->
    <text x="${Math.round((divX + W) / 2)}" y="345"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="14" fill="#CCCCCC"
          text-anchor="middle">
      <tspan font-weight="bold" fill="#FFFFFF">Venue:</tspan> ${displayVenue}
    </text>
    <text x="${Math.round((divX + W) / 2)}" y="370"
          font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif"
          font-size="14" fill="#CCCCCC"
          text-anchor="middle">
      <tspan font-weight="bold" fill="#FFFFFF">Date:</tspan> ${displayDate}
      <tspan dx="20" font-weight="bold" fill="#FFFFFF">Time:</tspan> ${displayTime}
    </text>

    <!-- ── BOTTOM ACCENT LINE ──────────────────────────────────── -->
    <rect x="0" y="${H - 18}" width="${W}" height="18"
          fill="url(#lineGrad)" opacity="0.85"/>

    <!-- Spider-Man character (bottom-right) — white BG removed in renderTicket.js -->
    ${spiderManUri
      ? `<image href="${spiderManUri}"
               x="${W - 196}" y="${H - 210}"
               width="180" height="188"
               preserveAspectRatio="xMidYMax meet"
               opacity="1"/>`
      : ``
    }

  </g>

  <!-- Notch fill circles rendered ON TOP of clip to restore the notch indentation
       (clip already removed the semi-circles; these white fills on the visible
       edge of the SVG canvas create the visual "punched hole" look in email clients
       that render SVG at canvas level) -->
  <!-- Left notch indicator -->
  <circle cx="0" cy="${notchY}" r="${notchR}" fill="#FFFFFF"/>
  <!-- Right notch indicator -->
  <circle cx="${W}" cy="${notchY}" r="${notchR}" fill="#FFFFFF"/>

</svg>`;
}

// ── Internal helper: synthesise a lightweight SVG spider-web pattern ──────────
function buildSVGWeb(W, H) {
  // Radiate 8 main strands from a focal point in the upper-right quadrant
  const cx = W * 0.60;
  const cy = H * 0.35;
  const maxR = Math.max(W, H) * 1.1;
  const strands = 12;
  const rings = 7;

  const lines = [];

  // Radial strands
  for (let i = 0; i < strands; i++) {
    const angle = (i / strands) * 2 * Math.PI;
    const ex = cx + Math.cos(angle) * maxR;
    const ey = cy + Math.sin(angle) * maxR;
    lines.push(
      `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"
             stroke="rgba(255,255,255,0.13)" stroke-width="0.8"/>`
    );
  }

  // Concentric polygon rings
  for (let r = 1; r <= rings; r++) {
    const radius = (maxR / (rings + 1)) * r;
    const points = [];
    for (let i = 0; i < strands; i++) {
      const angle = (i / strands) * 2 * Math.PI;
      points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
    }
    lines.push(
      `<polygon points="${points.join(" ")}"
               fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="0.7"/>`
    );
  }

  return `<g id="webPattern">${lines.join("\n")}</g>`;
}
