'use strict';

/* ================================================================
   ESP32-S3 Simulator — app.js
   All simulator logic: board, components, wiring, code execution
   ================================================================ */

// ----------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------
const CANVAS_W = 2600;
const CANVAS_H = 1500;
const BOARD_X  = 210;   // left edge of PCB on canvas
const BOARD_Y  = 40;    // top edge of PCB
const BOARD_W  = 152;   // PCB width
const PIN_SPACING = 22; // vertical distance between pins
const FIRST_PIN_Y = BOARD_Y + 62; // y of first pin row
const LEFT_PIN_X  = BOARD_X - 18; // connection dot x, left side
const RIGHT_PIN_X = BOARD_X + BOARD_W + 18; // right side
const PIN_R = 4.5;      // pin dot radius
const PIN_HIT_R = 11;   // hit-test radius
const GRID = 20;        // snap grid
const COMP_PIN_R = 4;   // component pin dot radius
const COMP_PIN_HIT_R = 10;

const WIRE_COLORS = [
  '#4fc3f7','#f48fb1','#a5d6a7','#fff176',
  '#ffab91','#ce93d8','#80deea','#ffcc80'
];

// Pin type colours
const PIN_TYPE_COLOR = {
  power3v3: '#ff6b6b',
  power5v:  '#ff8c42',
  gnd:      '#7f8c8d',
  gpio:     '#00d4aa',
  ctrl:     '#ffd700',
  psram:    '#ff6b00',  // orange — reserved by Octal PSRAM (N16R8)
};

// ----------------------------------------------------------------
// ESP32-S3-DEVKITC-1 PIN DEFINITIONS  (22 pins per side — accurate)
// Source: Official Espressif ESP32-S3-DevKitC-1 pinout diagram
// ----------------------------------------------------------------
const LEFT_PIN_DEFS = [
  // top → bottom
  { label:'3V3',  type:'power3v3', info:'3.3V Power Rail' },
  { label:'3V3',  type:'power3v3', info:'3.3V Power Rail' },
  { label:'RST',  type:'ctrl',     info:'Reset (active LOW)' },
  { label:'IO4',  type:'gpio', num:4,  info:'ADC1_CH3 · TOUCH4 · RTC' },
  { label:'IO5',  type:'gpio', num:5,  info:'ADC1_CH4 · TOUCH5 · RTC' },
  { label:'IO6',  type:'gpio', num:6,  info:'ADC1_CH5 · TOUCH6 · RTC' },
  { label:'IO7',  type:'gpio', num:7,  info:'ADC1_CH6 · TOUCH7 · RTC' },
  { label:'IO15', type:'gpio', num:15, info:'ADC2_CH4 · U0RTS · XTAL_32K · RTC' },
  { label:'IO16', type:'gpio', num:16, info:'ADC2_CH5 · U0CTS · XTAL_32K · RTC' },
  { label:'IO17', type:'gpio', num:17, info:'ADC2_CH6 · U1TXD · CLK_OUT2 · RTC' },
  { label:'IO18', type:'gpio', num:18, info:'ADC2_CH7 · U1RXD · CLK_OUT3 · RTC' },
  { label:'IO8',  type:'gpio', num:8,  info:'ADC1_CH7 · TOUCH8 · JTAG · RTC' },
  { label:'IO3',  type:'gpio', num:3,  info:'ADC1_CH2 · TOUCH3 · JTAG · RTC' },
  { label:'IO46', type:'gpio', num:46, info:'FSPIHD · LOG (default UART log)' },
  { label:'IO9',  type:'gpio', num:9,  info:'ADC1_CH8 · TOUCH9 · FSPIHD · RTC' },
  { label:'IO10', type:'gpio', num:10, info:'ADC1_CH9 · TOUCH10 · FSPICS0 · RTC' },
  { label:'IO11', type:'gpio', num:11, info:'ADC2_CH0 · TOUCH11 · FSPID · RTC' },
  { label:'IO12', type:'gpio', num:12, info:'ADC2_CH1 · TOUCH12 · FSPICLK · RTC' },
  { label:'IO13', type:'gpio', num:13, info:'ADC2_CH2 · TOUCH13 · FSPIQ · RTC' },
  { label:'IO14', type:'gpio', num:14, info:'ADC2_CH3 · TOUCH14 · FSPIWP · RTC' },
  { label:'5V',   type:'power5v',  info:'5V USB Power Output' },
  { label:'GND',  type:'gnd',      info:'Ground' },
];

const RIGHT_PIN_DEFS = [
  // top → bottom
  { label:'GND',  type:'gnd',      info:'Ground' },
  { label:'TX',   type:'gpio', num:43, info:'U0TXD · CLK_OUT1 (default UART0 TX)' },
  { label:'RX',   type:'gpio', num:44, info:'U0RXD · CLK_OUT2 (default UART0 RX)' },
  { label:'IO1',  type:'gpio', num:1,  info:'TOUCH1 · ADC1_CH0 · RTC' },
  { label:'IO2',  type:'gpio', num:2,  info:'TOUCH2 · ADC1_CH1 · RTC' },
  { label:'IO42', type:'gpio', num:42, info:'MTMS · JTAG' },
  { label:'IO41', type:'gpio', num:41, info:'MTDI · JTAG · CLK_OUT1' },
  { label:'IO40', type:'gpio', num:40, info:'MTDO · JTAG · CLK_OUT2' },
  { label:'IO39', type:'gpio', num:39, info:'MTCK · JTAG · CLK_OUT3 · SUBSPICS1' },
  { label:'IO38', type:'gpio', num:38, info:'FSPIWP · SUBSPIWP' },
  { label:'IO37', type:'psram', num:37, info:'⚠ N16R8 PSRAM: SPIDQS · FSPIQ · SUBSPIQ' },
  { label:'IO36', type:'psram', num:36, info:'⚠ N16R8 PSRAM: SPIIO7 · FSPICLK · SUBSPIDCLK' },
  { label:'IO35', type:'psram', num:35, info:'⚠ N16R8 PSRAM: SPIIO6 · FSPID · SUBSPID' },
  { label:'IO0',  type:'gpio', num:0,  info:'BOOT button · Strapping pin' },
  { label:'IO45', type:'gpio', num:45, info:'Strapping pin (VSPI)' },
  { label:'IO48', type:'gpio', num:48, info:'RGB_LED · SPICLK_N' },
  { label:'IO47', type:'gpio', num:47, info:'SPICLK_P' },
  { label:'IO21', type:'gpio', num:21, info:'RTC' },
  { label:'IO20', type:'gpio', num:20, info:'USB_D+ · U1CTS · ADC2_CH9 · RTC' },
  { label:'IO19', type:'gpio', num:19, info:'USB_D- · U1RTS · ADC2_CH8 · RTC' },
  { label:'GND',  type:'gnd',      info:'Ground' },
  { label:'GND',  type:'gnd',      info:'Ground' },
];

const BOARD_H = FIRST_PIN_Y + (Math.max(LEFT_PIN_DEFS.length, RIGHT_PIN_DEFS.length) - 1) * PIN_SPACING + 55 - BOARD_Y;

// Build board pin objects
function buildBoardPins() {
  const pins = [];
  LEFT_PIN_DEFS.forEach((def, i) => {
    pins.push({
      id: `left_${i}`, side: 'left', ...def,
      cx: LEFT_PIN_X,
      cy: FIRST_PIN_Y + i * PIN_SPACING,
    });
  });
  RIGHT_PIN_DEFS.forEach((def, i) => {
    pins.push({
      id: `right_${i}`, side: 'right', ...def,
      cx: RIGHT_PIN_X,
      cy: FIRST_PIN_Y + i * PIN_SPACING,
    });
  });
  return pins;
}

// ----------------------------------------------------------------
// BOARD DRAWING
// ----------------------------------------------------------------
function drawBoard(ctx, boardPins, pinStates, hoveredPinId) {
  const x = BOARD_X, y = BOARD_Y, w = BOARD_W, h = BOARD_H;

  ctx.save();

  // --- PCB glow shadow ---
  ctx.shadowBlur = 28;
  ctx.shadowColor = 'rgba(0,200,130,0.22)';

  // PCB body
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = '#1b5c30';
  ctx.fill();
  ctx.shadowBlur = 0;

  roundRect(ctx, x, y, w, h, 9);
  ctx.strokeStyle = '#2a7a42';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle PCB texture
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let ly = y + 20; ly < y + h - 10; ly += 18) {
    ctx.beginPath(); ctx.moveTo(x + 4, ly); ctx.lineTo(x + w - 4, ly); ctx.stroke();
  }

  // --- Module area (WROOM-2, N16R8 — slightly taller than WROOM-1) ---
  roundRect(ctx, x + 10, y + 72, w - 20, 228, 6);
  ctx.fillStyle = '#0e1c12';
  ctx.fill();
  ctx.strokeStyle = '#1e4c28';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Module label
  ctx.fillStyle = '#2a5c38';
  ctx.font = '5.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ESP32-S3-WROOM-2', x + w / 2 - 10, y + 283);

  // Antenna cutout in module (WROOM-2 has a slightly taller antenna trace area)
  ctx.fillStyle = '#0f1e14';
  ctx.fillRect(x + w - 30, y + 74, 28, 110);
  ctx.strokeStyle = '#2d5c3a';
  ctx.lineWidth = 0.7;
  ctx.setLineDash([2, 3]);
  ctx.strokeRect(x + w - 30, y + 74, 28, 110);
  ctx.setLineDash([]);
  ctx.fillStyle = '#2a5c38';
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(x + w - 16, y + 132);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ANTENNA', 0, 0);
  ctx.restore();

  // --- Main ESP32-S3 chip ---
  const cX = x + 22, cY = y + 100, cW = w - 52, cH = 82;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(cX, cY, cW, cH);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(cX, cY, cW, cH);

  // Chip pin bumps top
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cX + 6 + i * (cW - 12) / 8, cY - 3, 3, 3);
    ctx.fillRect(cX + 6 + i * (cW - 12) / 8, cY + cH, 3, 3);
  }

  // Chip label — ESP32-S3-N16R8
  ctx.fillStyle = '#d0d0d0';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ESP32-S3', cX + cW / 2, cY + 20);
  ctx.fillStyle = '#888';
  ctx.font = 'bold 7px monospace';
  ctx.fillText('N16R8', cX + cW / 2, cY + 31);
  ctx.fillStyle = '#555';
  ctx.font = '5.5px monospace';
  ctx.fillText('ESPRESSIF', cX + cW / 2, cY + 41);
  ctx.fillText('Xtensa LX7 × 2 · 240 MHz', cX + cW / 2, cY + 51);
  // Memory specs
  ctx.fillStyle = '#3a7a5a';
  ctx.font = '5.5px monospace';
  ctx.fillText('16MB Flash  ·  8MB OPI PSRAM', cX + cW / 2, cY + 62);
  // Divider
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cX + 4, cY + 66);
  ctx.lineTo(cX + cW - 4, cY + 66);
  ctx.stroke();
  // Octal PSRAM note
  ctx.fillStyle = '#5a3a00';
  ctx.font = '4.5px monospace';
  ctx.fillText('IO35/36/37 → OPI PSRAM', cX + cW / 2, cY + 75);

  // --- USB-C connector ---
  const uX = x + w / 2 - 20, uY = y + h - 32;
  roundRect(ctx, uX, uY, 40, 26, 5);
  ctx.fillStyle = '#777';
  ctx.fill();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  roundRect(ctx, uX + 4, uY + 4, 32, 18, 3);
  ctx.fillStyle = '#3a3a3a';
  ctx.fill();
  ctx.fillStyle = '#666';
  ctx.font = '5.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('USB-C', x + w / 2, uY + 15);

  // --- EN button (red) ---
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 13, y + 30, 15, 15);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 13, y + 30, 15, 15);
  ctx.fillStyle = '#880000';
  ctx.beginPath();
  ctx.arc(x + 20.5, y + 37.5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.arc(x + 20.5, y + 37.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a7a6a';
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EN', x + 20.5, y + 24);

  // --- BOOT button (blue) ---
  ctx.fillStyle = '#111';
  ctx.fillRect(x + w - 28, y + 30, 15, 15);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + w - 28, y + 30, 15, 15);
  ctx.fillStyle = '#000066';
  ctx.beginPath();
  ctx.arc(x + w - 20.5, y + 37.5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0000bb';
  ctx.beginPath();
  ctx.arc(x + w - 20.5, y + 37.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a7a6a';
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('IO0', x + w - 20.5, y + 24);

  // --- Power LED (green, always on) ---
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00ff44';
  ctx.fillStyle = '#00cc33';
  ctx.beginPath();
  ctx.arc(x + 20, y + 63, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#336633';
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PWR', x + 20, y + 56);

  // --- 16MB Flash chip ---
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(x + 14, y + h - 88, 32, 22);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 14, y + h - 88, 32, 22);
  ctx.fillStyle = '#3a3a3a';
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('16MB', x + 30, y + h - 79);
  ctx.fillText('FLASH', x + 30, y + h - 71);

  // --- 8MB OPI PSRAM chip (separate IC on WROOM-2) ---
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(x + w - 46, y + h - 88, 32, 22);
  ctx.strokeStyle = '#3a2000';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + w - 46, y + h - 88, 32, 22);
  ctx.fillStyle = '#5a3a00';
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('8MB', x + w - 30, y + h - 79);
  ctx.fillText('PSRAM', x + w - 30, y + h - 71);

  // --- Board label ---
  ctx.fillStyle = '#3a6a4a';
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ESP32-S3-DevKitC-1  N16R8', x + w / 2, y + h - 45);

  // --- Copper trace lines from pin pads to board edge ---
  ctx.strokeStyle = 'rgba(184,134,11,0.25)';
  ctx.lineWidth = 1;
  boardPins.forEach(pin => {
    const ex = pin.side === 'left' ? x : x + w;
    ctx.beginPath();
    ctx.moveTo(pin.cx, pin.cy);
    ctx.lineTo(ex, pin.cy);
    ctx.stroke();
  });

  // --- Pin pads (gold squares on board edge) ---
  boardPins.forEach(pin => {
    const padX = pin.side === 'left' ? x - 4 : x + w - 4;
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(padX, pin.cy - 3.5, 8, 7);
    ctx.strokeStyle = '#c8a000';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(padX, pin.cy - 3.5, 8, 7);
  });

  // --- Pin connection dots ---
  boardPins.forEach(pin => {
    const isPSRAM  = pin.type === 'psram';
    const isHovered = pin.id === hoveredPinId;
    const pinState = pin.type === 'gpio' ? (pinStates[pin.num] || null) : null;
    const isHigh   = pinState && pinState.value === 1;
    const hasAnalog = pinState && pinState.pwm > 0;

    if (isPSRAM) {
      // PSRAM-reserved pin — draw as crossed-out orange dot
      ctx.fillStyle = '#3a1800';
      ctx.strokeStyle = '#ff6b00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pin.cx, pin.cy, PIN_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // X mark
      ctx.strokeStyle = '#ff6b00';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      const r = PIN_R - 1;
      ctx.beginPath();
      ctx.moveTo(pin.cx - r, pin.cy - r); ctx.lineTo(pin.cx + r, pin.cy + r);
      ctx.moveTo(pin.cx + r, pin.cy - r); ctx.lineTo(pin.cx - r, pin.cy + r);
      ctx.stroke();
    } else if (isHigh || hasAnalog) {
      // GPIO HIGH — glow teal
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00d4aa';
      ctx.fillStyle = '#00d4aa';
      ctx.beginPath();
      ctx.arc(pin.cx, pin.cy, PIN_R + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = isHovered ? '#00d4aa' : '#c8a000';
      ctx.strokeStyle = isHovered ? 'rgba(0,212,170,0.4)' : 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pin.cx, pin.cy, isHovered ? PIN_R + 2 : PIN_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Type colour strip
    const tc = PIN_TYPE_COLOR[pin.type] || '#ccc';
    ctx.fillStyle = tc;
    const stripX = pin.side === 'left' ? pin.cx - 18 : pin.cx + 10;
    ctx.fillRect(stripX, pin.cy - 3, 6, 6);

    // Pin label — dim + strikethrough for PSRAM pins
    ctx.fillStyle = isPSRAM ? '#6b3a00' : (isHovered ? '#e2e8f0' : '#94a3b8');
    ctx.font = `${isHovered ? 'bold ' : ''}9px monospace`;
    ctx.textAlign = pin.side === 'left' ? 'right' : 'left';
    const labelX = pin.side === 'left' ? pin.cx - 24 : pin.cx + 24;
    ctx.fillText(pin.label, labelX, pin.cy + 3.5);

    // Strikethrough for PSRAM pins
    if (isPSRAM) {
      const tw = ctx.measureText(pin.label).width;
      const lx = pin.side === 'left' ? labelX - tw : labelX;
      ctx.strokeStyle = '#6b3a00';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(lx, pin.cy + 1);
      ctx.lineTo(lx + tw, pin.cy + 1);
      ctx.stroke();
    }
  });

  ctx.restore();
}

// ----------------------------------------------------------------
// CANVAS UTILITY
// ----------------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function dimHex(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const d = (v) => Math.max(0, Math.round(v * factor)).toString(16).padStart(2, '0');
  return `#${d(r)}${d(g)}${d(b)}`;
}

// ----------------------------------------------------------------
// COMPONENT CLASSES
// ----------------------------------------------------------------
let _compIdCounter = 0;

class CompBase {
  constructor(type, x, y) {
    this.id   = `comp_${++_compIdCounter}`;
    this.type = type;
    this.x    = x;
    this.y    = y;
  }

  // Override — return [{name, dx, dy}]
  pinDefs() { return []; }

  // Get pin absolute positions
  absPins() {
    return this.pinDefs().map(p => ({
      ...p,
      id: `${this.id}_${p.name}`,
      cx: this.x + p.dx,
      cy: this.y + p.dy,
    }));
  }

  getPinAt(mx, my) {
    return this.absPins().find(p => Math.hypot(p.cx - mx, p.cy - my) < COMP_PIN_HIT_R) || null;
  }

  hitTest(mx, my) { return false; }

  draw(ctx, powered, brightness) {}

  drawPins(ctx, hoveredPinId) {
    this.absPins().forEach(p => {
      const hov = p.id === hoveredPinId;
      ctx.fillStyle = hov ? '#00d4aa' : '#ffd700';
      ctx.strokeStyle = hov ? 'rgba(0,212,170,0.5)' : 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, hov ? COMP_PIN_R + 1.5 : COMP_PIN_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

// --- LED ---
class LED extends CompBase {
  constructor(x, y, color = '#ff4444') {
    super('LED', x, y);
    this.color = color;
  }

  pinDefs() {
    return [
      { name: 'anode',   dx: 0, dy: -22, label: 'A (+)' },
      { name: 'cathode', dx: 0, dy: +22, label: 'K (-)' },
    ];
  }

  hitTest(mx, my) { return Math.hypot(mx - this.x, my - this.y) < 16; }

  draw(ctx, powered = false, brightness = 1) {
    const { x, y, color } = this;
    ctx.save();

    // Glow
    if (powered && brightness > 0) {
      const r = 28 + brightness * 10;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, color + Math.round(brightness * 0xaa).toString(16).padStart(2,'0'));
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Body
    ctx.shadowBlur = powered ? 14 * brightness : 0;
    ctx.shadowColor = color;
    const bodyColor = powered ? color : dimHex(color, 0.25);
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = powered ? color : '#444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Lens highlight
    if (powered) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(x - 3.5, y - 3.5, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Leads
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x, y - 22); ctx.stroke(); // anode
    ctx.beginPath(); ctx.moveTo(x, y + 11); ctx.lineTo(x, y + 22); ctx.stroke(); // cathode

    // + / − labels
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.fillText('+', x + 14, y - 16);
    ctx.fillText('−', x + 14, y + 21);

    // Type label
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5a7a8a';
    ctx.fillText('LED', x, y + 36);

    ctx.restore();
  }
}

// --- RESISTOR ---
class Resistor extends CompBase {
  constructor(x, y, ohms = 220) {
    super('Resistor', x, y);
    this.ohms = ohms;
  }

  pinDefs() {
    return [
      { name: 'p1', dx: -32, dy: 0, label: 'P1' },
      { name: 'p2', dx: +32, dy: 0, label: 'P2' },
    ];
  }

  hitTest(mx, my) { return Math.abs(mx - this.x) < 32 && Math.abs(my - this.y) < 9; }

  draw(ctx) {
    const { x, y } = this;
    ctx.save();

    // Leads
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 32, y); ctx.lineTo(x - 14, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(x + 32, y); ctx.stroke();

    // Body
    ctx.fillStyle = '#c8a96e';
    ctx.strokeStyle = '#a07840';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 14, y - 7, 28, 14);
    ctx.strokeRect(x - 14, y - 7, 28, 14);

    // Color bands
    const bands = this._bands();
    bands.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(x - 11 + i * 8, y - 7, 5, 14);
    });

    // Label
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5a7a8a';
    ctx.fillText(this._fmt(), x, y + 22);

    ctx.restore();
  }

  _fmt() {
    if (this.ohms >= 1e6) return (this.ohms / 1e6).toFixed(1) + 'MΩ';
    if (this.ohms >= 1000) return (this.ohms / 1000).toFixed(1) + 'kΩ';
    return this.ohms + 'Ω';
  }

  _bands() {
    const C = ['#000','#8B4513','#f00','#f80','#fd0','#0a0','#00f','#808','#888','#fff'];
    const s = String(this.ohms);
    const d1 = parseInt(s[0]) || 0;
    const d2 = parseInt(s[1]) || 0;
    const mult = s.length - 2;
    const mCol = ['#000','#8B4513','#f00','#f80','#fd0','#0a0','#00f','#808','#888','#fff'];
    return [C[d1], C[d2], mCol[mult] || '#f90', '#c8a000']; // 4 bands
  }
}

// --- PUSHBUTTON ---
class PushButton extends CompBase {
  constructor(x, y) {
    super('Button', x, y);
    this.pressed = false;
  }

  pinDefs() {
    return [
      { name: 'p1', dx: -18, dy: 0, label: 'P1' },
      { name: 'p2', dx: +18, dy: 0, label: 'P2' },
    ];
  }

  hitTest(mx, my) { return Math.abs(mx - this.x) < 16 && Math.abs(my - this.y) < 16; }

  draw(ctx) {
    const { x, y, pressed } = this;
    ctx.save();

    // Leads
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x - 13, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 13, y); ctx.lineTo(x + 18, y); ctx.stroke();

    // Housing
    ctx.fillStyle = pressed ? '#0e2a4f' : '#162240';
    ctx.strokeStyle = '#4d96ff';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 13, y - 13, 26, 26);
    ctx.strokeRect(x - 13, y - 13, 26, 26);

    // Button cap
    if (pressed) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#4d96ff';
    }
    ctx.fillStyle = pressed ? '#2980b9' : '#1a6296';
    ctx.beginPath();
    ctx.arc(x, y, pressed ? 7 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Highlight on cap
    if (!pressed) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4a6a8a';
    ctx.fillText('BTN', x, y + 26);

    ctx.restore();
  }
}

// --- BUZZER ---
class Buzzer extends CompBase {
  constructor(x, y) {
    super('Buzzer', x, y);
    this._lastTone = 0;
    this._audioCtx = null;
  }

  pinDefs() {
    return [
      { name: 'pos', dx: -12, dy: +18, label: '+' },
      { name: 'neg', dx: +12, dy: +18, label: '−' },
    ];
  }

  hitTest(mx, my) { return Math.hypot(mx - this.x, my - this.y) < 18; }

  draw(ctx, powered = false) {
    const { x, y } = this;
    ctx.save();

    // Sound waves
    if (powered) {
      for (let r = 22; r <= 44; r += 11) {
        ctx.strokeStyle = `rgba(255,200,0,${0.5 - r / 100})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r, -Math.PI * 0.6, -Math.PI * 2.4, true);
        ctx.stroke();
      }
    }

    // Can
    ctx.shadowBlur = powered ? 12 : 0;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = powered ? '#222' : '#1a1a1a';
    ctx.strokeStyle = powered ? '#ffd700' : '#444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Grille lines
    ctx.strokeStyle = powered ? '#555' : '#333';
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i += 4) {
      const hw = Math.sqrt(Math.max(0, 14 * 14 - i * i));
      ctx.beginPath();
      ctx.moveTo(x - hw, y + i);
      ctx.lineTo(x + hw, y + i);
      ctx.stroke();
    }

    // + mark
    ctx.fillStyle = powered ? '#ffd700' : '#666';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+', x - 8, y + 5);

    // Leads
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 12, y + 16); ctx.lineTo(x - 12, y + 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 12, y + 16); ctx.lineTo(x + 12, y + 18); ctx.stroke();

    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4a6a8a';
    ctx.fillText('BUZZ', x, y + 34);

    ctx.restore();
  }

  beep(powered) {
    if (!powered) return;
    const now = Date.now();
    if (now - this._lastTone < 200) return;
    this._lastTone = now;
    try {
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = this._audioCtx.createOscillator();
      const gain = this._audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, this._audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this._audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this._audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this._audioCtx.destination);
      osc.start();
      osc.stop(this._audioCtx.currentTime + 0.12);
    } catch (e) { /* Audio not supported */ }
  }
}

// --- POTENTIOMETER ---
class Potentiometer extends CompBase {
  constructor(x, y) {
    super('Potentiometer', x, y);
    this.value = 0.5; // 0..1
  }

  pinDefs() {
    return [
      { name: 'vcc',   dx: -20, dy: +20, label: 'VCC' },
      { name: 'wiper', dx: 0,   dy: +20, label: 'OUT' },
      { name: 'gnd',   dx: +20, dy: +20, label: 'GND' },
    ];
  }

  hitTest(mx, my) { return Math.hypot(mx - this.x, my - this.y) < 20; }

  draw(ctx) {
    const { x, y, value } = this;
    ctx.save();

    // Body
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 20, y - 18, 40, 36);
    ctx.strokeRect(x - 20, y - 18, 40, 36);

    // Track arc
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, 11, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.stroke();

    // Value arc
    const angle = 0.75 * Math.PI + value * 1.5 * Math.PI;
    ctx.strokeStyle = '#00d4aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0.75 * Math.PI, angle);
    ctx.stroke();

    // Wiper indicator
    ctx.strokeStyle = '#00d4aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 9 * Math.cos(angle), y + 9 * Math.sin(angle));
    ctx.stroke();

    // Leads (3 pins)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 20, y + 18); ctx.lineTo(x - 20, y + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,      y + 18); ctx.lineTo(x,      y + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 20, y + 18); ctx.lineTo(x + 20, y + 20); ctx.stroke();

    // Value text
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00d4aa';
    ctx.fillText(Math.round(value * 100) + '%', x, y + 38);

    ctx.fillStyle = '#4a6a8a';
    ctx.fillText('POT', x, y - 22);

    ctx.restore();
  }

  getAnalogValue() { return Math.round(this.value * 4095); }
}

// ----------------------------------------------------------------
// CIRCUIT EVALUATOR
// ----------------------------------------------------------------
class CircuitEvaluator {
  constructor() {
    this.boardPins  = [];
    this.components = [];
    this.wires      = [];
    this.pinStates  = {};
  }

  // Returns { powered, brightness } for a component
  evalComponent(comp) {
    if (comp.type === 'LED') {
      return this._evalLED(comp);
    }
    if (comp.type === 'Buzzer') {
      const { powered } = this._evalBuzzer(comp);
      comp.beep(powered);
      return { powered };
    }
    return { powered: false, brightness: 0 };
  }

  _evalLED(led) {
    const [anodePin] = led.absPins().filter(p => p.name === 'anode');
    const [cathodePin] = led.absPins().filter(p => p.name === 'cathode');
    const anodeNet  = this._getNet(anodePin.id);
    const cathodeNet = this._getNet(cathodePin.id);

    const aHigh = this._netIsHigh(anodeNet);
    const cLow  = this._netIsLow(cathodeNet);

    if (!aHigh || !cLow) return { powered: false, brightness: 0 };

    // Check PWM brightness
    const pwm = this._netPwm(anodeNet);
    return { powered: true, brightness: pwm !== null ? pwm / 255 : 1 };
  }

  _evalBuzzer(buzzer) {
    const posPin = buzzer.absPins().find(p => p.name === 'pos');
    const negPin = buzzer.absPins().find(p => p.name === 'neg');
    const posNet = this._getNet(posPin.id);
    const negNet = this._getNet(negPin.id);
    return {
      powered: this._netIsHigh(posNet) && this._netIsLow(negNet),
    };
  }

  // Read digital value for a GPIO (considers button overrides)
  readDigital(gpioNum) {
    const state = this.pinStates[gpioNum];
    if (state && state._override !== undefined) return state._override;
    if (state) return state.value;

    // Check if the pin is connected through any component
    const boardPin = this.boardPins.find(p => p.type === 'gpio' && p.num === gpioNum);
    if (!boardPin) return 0;
    const net = this._getNet(`board_${boardPin.id}`);
    if (this._netIsHigh(net)) return 1;
    if (this._netIsLow(net)) return 0;
    return 0;
  }

  readAnalog(gpioNum) {
    // Look for potentiometer wiper connected to this GPIO
    const boardPin = this.boardPins.find(p => p.type === 'gpio' && p.num === gpioNum);
    if (!boardPin) return 0;
    const netId = `board_${boardPin.id}`;
    for (const w of this.wires) {
      const other = w.fromId === netId ? w.toId : (w.toId === netId ? w.fromId : null);
      if (!other) continue;
      // Find the component pin this belongs to
      for (const comp of this.components) {
        if (comp.type === 'Potentiometer') {
          const wiperPin = comp.absPins().find(p => p.name === 'wiper');
          if (wiperPin && wiperPin.id === other) {
            return comp.getAnalogValue();
          }
        }
      }
    }
    return 0;
  }

  // Update button pin overrides
  updateButtonPins() {
    // Clear previous overrides
    Object.values(this.pinStates).forEach(s => delete s._override);

    for (const comp of this.components) {
      if (comp.type !== 'Button' || !comp.pressed) continue;
      const [p1pin, p2pin] = comp.absPins();

      // Find what each button pin is connected to
      const p1conn = this._directConnections(p1pin.id);
      const p2conn = this._directConnections(p2pin.id);

      // Determine voltage of each side
      const v1 = this._connVoltage(p1conn);
      const v2 = this._connVoltage(p2conn);

      // Bridge: inject voltage from one side to GPIO on other side
      if (v1 !== null) this._injectToGPIO(p2conn, v1);
      if (v2 !== null) this._injectToGPIO(p1conn, v2);
    }
  }

  _directConnections(pinId) {
    const result = [];
    for (const w of this.wires) {
      if (w.fromId === pinId) result.push(w.toId);
      if (w.toId === pinId) result.push(w.fromId);
    }
    return result;
  }

  _connVoltage(connIds) {
    for (const id of connIds) {
      const bp = this._boardPinById(id);
      if (!bp) continue;
      if (bp.type === 'power3v3' || bp.type === 'power5v') return 1;
      if (bp.type === 'gnd') return 0;
      if (bp.type === 'gpio') {
        const s = this.pinStates[bp.num];
        if (s && s.mode === 'OUTPUT') return s.value;
      }
    }
    return null;
  }

  _injectToGPIO(connIds, voltage) {
    for (const id of connIds) {
      const bp = this._boardPinById(id);
      if (bp && bp.type === 'gpio') {
        if (!this.pinStates[bp.num]) {
          this.pinStates[bp.num] = { mode: 'INPUT', value: 0, pwm: 0 };
        }
        this.pinStates[bp.num]._override = voltage;
      }
    }
  }

  _boardPinById(id) {
    // id is either `board_left_N` / `board_right_N` format or just the pin id from absPins
    const prefix = 'board_';
    if (!id.startsWith(prefix)) return null;
    const pinId = id.slice(prefix.length);
    return this.boardPins.find(p => p.id === pinId) || null;
  }

  // Get all pin IDs in the same net as pinId (union-find via BFS)
  _getNet(pinId) {
    const visited = new Set([pinId]);
    const queue = [pinId];
    while (queue.length) {
      const cur = queue.shift();
      for (const w of this.wires) {
        let next = null;
        if (w.fromId === cur) next = w.toId;
        if (w.toId === cur)   next = w.fromId;
        if (next && !visited.has(next)) {
          visited.add(next);
          queue.push(next);
          // Resistor pass-through: if next is a resistor pin, add other resistor pin
          for (const comp of this.components) {
            if (comp.type === 'Resistor') {
              const pins = comp.absPins();
              const match = pins.find(p => p.id === next);
              if (match) {
                const other = pins.find(p => p.id !== next);
                if (other && !visited.has(other.id)) {
                  visited.add(other.id);
                  queue.push(other.id);
                }
              }
            }
          }
        }
      }
    }
    return visited;
  }

  _netIsHigh(net) {
    for (const id of net) {
      const bp = this._boardPinFromNetId(id);
      if (!bp) continue;
      if (bp.type === 'power3v3' || bp.type === 'power5v') return true;
      if (bp.type === 'gpio') {
        const s = this.pinStates[bp.num];
        if (s && s.value === 1) return true;
      }
    }
    return false;
  }

  _netIsLow(net) {
    for (const id of net) {
      const bp = this._boardPinFromNetId(id);
      if (!bp) continue;
      if (bp.type === 'gnd') return true;
      if (bp.type === 'gpio') {
        const s = this.pinStates[bp.num];
        if (!s || s.value === 0) {
          // Only use LOW gpio if it's explicitly OUTPUT LOW
          if (s && s.mode === 'OUTPUT' && s.value === 0) return true;
        }
      }
    }
    return false;
  }

  _netPwm(net) {
    for (const id of net) {
      const bp = this._boardPinFromNetId(id);
      if (bp && bp.type === 'gpio') {
        const s = this.pinStates[bp.num];
        if (s && s.pwm !== undefined && s.pwm > 0) return s.pwm;
      }
    }
    return null;
  }

  _boardPinFromNetId(id) {
    // Component pin IDs look like `comp_N_pinname`, board pins like `board_left_N`
    if (!id.startsWith('board_')) return null;
    const pinId = id.slice('board_'.length);
    return this.boardPins.find(p => p.id === pinId) || null;
  }
}

// ----------------------------------------------------------------
// SERIAL MONITOR
// ----------------------------------------------------------------
class SerialMonitor {
  constructor(el) {
    this.el    = el;
    this._buf  = '';
    this._lines = [];
    this._max  = 800;
    this._empty = true;
    this._clearEmpty();
  }

  _clearEmpty() {
    if (this._empty) {
      this.el.innerHTML = '';
      this._empty = false;
    }
  }

  append(text) {
    this._clearEmpty();
    this._buf += text;
    const parts = this._buf.split('\n');
    this._buf = parts.pop(); // keep incomplete line

    if (parts.length) {
      parts.forEach(line => this._addLine(line));
    } else {
      // Update last line in place
      const last = this.el.lastElementChild;
      if (last && last.classList.contains('serial-line')) {
        last.textContent = last.textContent + text;
      } else {
        const div = document.createElement('div');
        div.className = 'serial-line';
        div.textContent = text;
        this.el.appendChild(div);
      }
      this._scroll();
    }
  }

  appendLine(text, type = 'normal') {
    this._clearEmpty();
    if (this._buf) {
      this._addLine(this._buf, type);
      this._buf = '';
    }
    this._addLine(text, type);
  }

  _addLine(text, type = 'normal') {
    const div = document.createElement('div');
    div.className = 'serial-line' + (type !== 'normal' ? ' ' + type : '');
    div.textContent = text;
    this.el.appendChild(div);
    this._lines.push(div);
    if (this._lines.length > this._max) {
      const old = this._lines.shift();
      old.remove();
    }
    this._scroll();
  }

  _scroll() {
    this.el.scrollTop = this.el.scrollHeight;
  }

  clear() {
    this.el.innerHTML = '<div class="serial-empty">Serial output will appear here…</div>';
    this._lines = [];
    this._buf   = '';
    this._empty = true;
  }
}

// ----------------------------------------------------------------
// ARDUINO INTERPRETER
// ----------------------------------------------------------------
class ArduinoInterpreter {
  constructor(board, evaluator, serial) {
    this.board     = board;  // reference to pinStates
    this.evaluator = evaluator;
    this.serial    = serial;
    this._state    = null;
    this.running   = false;
    this.speed     = 1;
    this._startMs  = 0;
  }

  async run(code) {
    if (this.running) this.stop();

    this._state   = { stop: false };
    this.running  = true;
    this._startMs = Date.now();

    const transpiled = this._transpile(code);
    const env = this._buildEnv(this._state);

    try {
      // We wrap transpiled code in a non-strict function so `with` is allowed
      const fnBody = `
        return (async function() {
          with (_env) {
            ${transpiled}
            if (typeof setup === 'function') await setup();
            while (!_env.__stop) {
              if (typeof loop === 'function') await loop();
              await _env.__yield();
            }
          }
        })();
      `;
      const fn = new Function('_env', fnBody); // eslint-disable-line no-new-func
      await fn(env);
    } catch (e) {
      if (e.message !== '__STOPPED__') {
        this.serial.appendLine('[ERROR] ' + e.message, 'error');
        console.warn('[Arduino interpreter]', e);
      }
    }

    this.running = false;
    this._state  = null;
  }

  stop() {
    if (this._state) {
      this._state.stop = true;
    }
    this.running = false;
    // Reset all pin states
    Object.keys(this.board).forEach(k => delete this.board[k]);
    _dirty = true;
  }

  _transpile(code) {
    let js = code;

    // Strip includes
    js = js.replace(/#include\s*<[^>]*>\s*/g, '');
    js = js.replace(/#include\s*"[^"]*"\s*/g, '');

    // #define → const
    js = js.replace(/#define\s+(\w+)\s+([^\n\r]+)/g,
      (_, name, val) => `const ${name} = ${val.trim()};`);

    // Remove remaining # directives
    js = js.replace(/#\w+[^\n]*/g, '');

    // Type removal for variable declarations (type name = / type name;)
    const TYPES = 'int|long|unsigned\\s+long|unsigned\\s+int|unsigned\\s+char|byte|char|float|double|boolean|bool|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|size_t|word';
    // Variable declarations
    js = js.replace(new RegExp(`\\b(?:${TYPES})\\s+(\\w+)\\s*(?=[=;,)])`, 'g'),
      (_, name) => `let ${name}`);
    // String type variable
    js = js.replace(/\bString\s+(\w+)/g, 'let $1');

    // void functions → async function
    js = js.replace(/\bvoid\s+(setup|loop)\s*\(\s*\)/g, 'async function $1()');
    js = js.replace(/\bvoid\s+(\w+)\s*\(/g, 'async function $1(');

    // Typed functions → async function
    js = js.replace(new RegExp(`\\b(?:${TYPES}|String|bool)\\s+(\\w+)\\s*\\(`, 'g'),
      (_, name) => `async function ${name}(`);

    // Inject await before delay calls
    js = js.replace(/(?<![.\w])delay\s*\(/g, 'await delay(');
    js = js.replace(/(?<![.\w])delayMicroseconds\s*\(/g, 'await delayMicroseconds(');

    // Boolean literals (C++ style, already valid in JS)
    js = js.replace(/\btrue\b/g, 'true').replace(/\bfalse\b/g, 'false');

    return js;
  }

  _buildEnv(state) {
    const board    = this.board;
    const serial   = this.serial;
    const eval_    = this.evaluator;
    const interp   = this;

    const env = {
      __stop:  false,
      __yield: () => new Promise(r => setTimeout(r, 0)),

      // GPIO
      HIGH: 1, LOW: 0,
      INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, INPUT_PULLDOWN: 3,
      LED_BUILTIN: 2,
      RISING: 1, FALLING: 2, CHANGE: 3,

      pinMode: (pin, mode) => {
        if (state.stop) { env.__stop = true; throw new Error('__STOPPED__'); }
        if (pin === 35 || pin === 36 || pin === 37) {
          serial.appendLine(`[WARN] GPIO${pin} is reserved for Octal PSRAM on N16R8 — do not use!`, 'warn');
        }
        if (!board[pin]) board[pin] = { mode: 'INPUT', value: 0, pwm: 0 };
        board[pin].mode = mode === 1 ? 'OUTPUT' : mode === 2 ? 'INPUT_PULLUP' : 'INPUT';
        _dirty = true;
      },

      digitalWrite: (pin, val) => {
        if (state.stop) { env.__stop = true; throw new Error('__STOPPED__'); }
        if (pin === 35 || pin === 36 || pin === 37) {
          serial.appendLine(`[WARN] GPIO${pin} is reserved for Octal PSRAM on N16R8!`, 'warn');
          return;
        }
        if (!board[pin]) board[pin] = { mode: 'OUTPUT', value: 0, pwm: 0 };
        board[pin].value = val ? 1 : 0;
        board[pin].pwm   = 0;
        _dirty = true;
      },

      digitalRead: (pin) => eval_.readDigital(pin),

      analogWrite: (pin, val) => {
        if (state.stop) { env.__stop = true; throw new Error('__STOPPED__'); }
        const v = Math.max(0, Math.min(255, Math.round(val)));
        if (!board[pin]) board[pin] = { mode: 'OUTPUT', value: 0, pwm: 0 };
        board[pin].pwm   = v;
        board[pin].value = v > 0 ? 1 : 0;
        _dirty = true;
      },

      analogRead: (pin) => eval_.readAnalog(pin),

      // Timing
      delay: (ms) => {
        if (state.stop) { env.__stop = true; throw new Error('__STOPPED__'); }
        return new Promise((resolve, reject) => {
          const t = setTimeout(() => {
            if (state.stop) { env.__stop = true; reject(new Error('__STOPPED__')); }
            else resolve();
          }, Math.max(0, ms / interp.speed));
          // Store so stop() can clear
          if (!state._timeouts) state._timeouts = new Set();
          state._timeouts.add(t);
        });
      },

      delayMicroseconds: (us) => env.delay(us / 1000),
      millis: () => Date.now() - interp._startMs,
      micros: () => (Date.now() - interp._startMs) * 1000,

      // Serial
      Serial: {
        begin: (baud) => serial.appendLine(`[Serial] ${baud} baud`, 'info'),
        print: (v) => serial.append(String(v)),
        println: (v) => serial.appendLine(String(v)),
        available: () => 0,
        read: () => -1,
        flush: () => {},
        write: (v) => serial.append(String.fromCharCode(v)),
      },

      // Math
      PI: Math.PI, TWO_PI: Math.PI * 2, HALF_PI: Math.PI / 2,
      abs: Math.abs,
      min: (a, b) => Math.min(a, b),
      max: (a, b) => Math.max(a, b),
      sqrt: Math.sqrt, pow: Math.pow,
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
      floor: Math.floor, ceil: Math.ceil, round: Math.round,
      map: (v, iMin, iMax, oMin, oMax) => (v - iMin) * (oMax - oMin) / (iMax - iMin) + oMin,
      constrain: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
      random: (a, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a),
      randomSeed: () => {},
      sq: (v) => v * v,

      // Bit ops
      bitRead:  (v, b) => (v >> b) & 1,
      bitSet:   (v, b) => v | (1 << b),
      bitClear: (v, b) => v & ~(1 << b),
      bitWrite: (v, b, x) => x ? (v | (1 << b)) : (v & ~(1 << b)),
      highByte: (v) => (v >> 8) & 0xFF,
      lowByte:  (v) => v & 0xFF,
      bit:      (b) => 1 << b,

      // Type conversions
      String:     (v) => String(v),
      int:        (v) => Math.trunc(Number(v)),
      float:      (v) => parseFloat(v),
      byte:       (v) => (v | 0) & 0xFF,
      char:       (v) => String.fromCharCode(v),
      boolean:    (v) => !!v,
      parseInt:   parseInt,
      parseFloat: parseFloat,
      isnan:      isNaN,

      // Misc
      sizeof:    () => 4,
      NULL:      null,
      true:      true,
      false:     false,
    };

    return env;
  }
}

// ----------------------------------------------------------------
// MAIN SIMULATOR APP
// ----------------------------------------------------------------
let _dirty = true; // render flag

class SimulatorApp {
  constructor() {
    this.canvas = document.getElementById('simCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.wrap   = document.getElementById('canvas-wrap');

    // State
    this.boardPins  = buildBoardPins();
    this.pinStates  = {}; // { gpioNum: { mode, value, pwm, _override } }
    this.components = [];
    this.wires      = [];

    // Interaction
    this.selectedTool   = null;  // e.g. 'led-red'
    this.wireFrom       = null;  // { id, cx, cy } — pin being wired
    this.dragging       = null;  // { comp, offsetX, offsetY }
    this.hoveredPinId   = null;
    this.mousePos       = { x: 0, y: 0 };

    // Circuit evaluation
    this.evaluator = new CircuitEvaluator();
    this.evaluator.boardPins  = this.boardPins;
    this.evaluator.components = this.components;
    this.evaluator.wires      = this.wires;
    this.evaluator.pinStates  = this.pinStates;

    // Serial monitor
    this.serial = new SerialMonitor(document.getElementById('serial-output'));

    // Arduino interpreter
    this.interp = new ArduinoInterpreter(this.pinStates, this.evaluator, this.serial);

    // Tooltip
    this.tooltip = document.getElementById('tooltip');

    this._init();
  }

  _init() {
    // Set canvas size
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;

    // Scroll canvas to show board nicely
    this.wrap.scrollLeft = 0;
    this.wrap.scrollTop  = 0;

    // Event listeners — canvas
    this.canvas.addEventListener('mousedown',   e => this._onDown(e));
    this.canvas.addEventListener('mousemove',   e => this._onMove(e));
    this.canvas.addEventListener('mouseup',     e => this._onUp(e));
    this.canvas.addEventListener('contextmenu', e => this._onContext(e));
    this.canvas.addEventListener('wheel',       e => this._onWheel(e), { passive: false });
    this.canvas.addEventListener('mouseleave',  () => { this.hoveredPinId = null; this.tooltip.classList.remove('visible'); _dirty = true; });

    // Toolbar
    document.getElementById('btn-run').addEventListener('click', () => this._runSim());
    document.getElementById('btn-stop').addEventListener('click', () => this._stopSim());
    document.getElementById('btn-clear-canvas').addEventListener('click', () => this._clearCanvas());
    document.getElementById('btn-clear-serial').addEventListener('click', () => this.serial.clear());
    document.getElementById('btn-serial-clear').addEventListener('click', () => this.serial.clear());
    document.getElementById('sim-speed').addEventListener('change', e => {
      this.interp.speed = parseFloat(e.target.value);
    });

    // Code editor keyboard shortcut
    document.getElementById('code-editor').addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this._runSim();
      }
      // Tab → insert spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = e.target;
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 2;
      }
    });

    // Palette items
    document.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.component;
        if (this.selectedTool === type) {
          this._deselectTool();
        } else {
          this._selectTool(type, item);
        }
      });
    });

    // Start render loop
    this._renderLoop();
  }

  // ---- TOOL SELECTION ----
  _selectTool(type, el) {
    this.selectedTool = type;
    document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    this.canvas.classList.add('tool-active');
    this.wireFrom = null;
    this.dragging = null;
  }

  _deselectTool() {
    this.selectedTool = null;
    document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('active'));
    this.canvas.classList.remove('tool-active');
  }

  // ---- CANVAS POSITION ----
  _canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  }

  _snap(v) { return Math.round(v / GRID) * GRID; }

  // ---- FIND PINS ----
  _findPinAt(mx, my) {
    // Board pins (skip PSRAM-reserved pins — they cannot be wired)
    for (const bp of this.boardPins) {
      if (bp.type === 'psram') continue;
      if (Math.hypot(bp.cx - mx, bp.cy - my) < PIN_HIT_R) {
        return { id: `board_${bp.id}`, cx: bp.cx, cy: bp.cy, boardPin: bp };
      }
    }
    // Component pins
    for (const comp of this.components) {
      const pin = comp.getPinAt(mx, my);
      if (pin) return { id: pin.id, cx: pin.cx, cy: pin.cy, comp };
    }
    return null;
  }

  _findCompAt(mx, my) {
    for (let i = this.components.length - 1; i >= 0; i--) {
      if (this.components[i].hitTest(mx, my)) return this.components[i];
    }
    return null;
  }

  // ---- EVENTS ----
  _onDown(e) {
    if (e.button !== 0) return;
    const { x, y } = this._canvasPos(e);

    // Place component
    if (this.selectedTool) {
      this._placeComp(this.selectedTool, this._snap(x), this._snap(y));
      if (!e.shiftKey) this._deselectTool();
      _dirty = true;
      return;
    }

    // Wire from pin?
    const pin = this._findPinAt(x, y);
    if (pin) {
      if (this.wireFrom) {
        this._completeWire(pin);
      } else {
        this.wireFrom = pin;
        this.canvas.classList.add('wiring');
      }
      _dirty = true;
      return;
    }

    // Interact with button?
    const comp = this._findCompAt(x, y);
    if (comp && comp.type === 'Button' && this.interp.running) {
      comp.pressed = true;
      this.evaluator.updateButtonPins();
      _dirty = true;
      return;
    }

    // Drag component (only when sim is stopped)
    if (comp && !this.interp.running) {
      this.dragging = { comp, offsetX: x - comp.x, offsetY: y - comp.y };
      _dirty = true;
      return;
    }

    // Click on empty canvas — cancel wire
    if (this.wireFrom) {
      this.wireFrom = null;
      this.canvas.classList.remove('wiring');
      _dirty = true;
    }
  }

  _onMove(e) {
    const { x, y } = this._canvasPos(e);
    this.mousePos = { x, y };

    // Drag component
    if (this.dragging) {
      const { comp, offsetX, offsetY } = this.dragging;
      comp.x = this._snap(x - offsetX);
      comp.y = this._snap(y - offsetY);
      _dirty = true;
    }

    // Hover detection — include PSRAM pins for tooltip but not wiring
    let hoveredBoardPin = null;
    for (const bp of this.boardPins) {
      if (Math.hypot(bp.cx - x, bp.cy - y) < PIN_HIT_R) { hoveredBoardPin = bp; break; }
    }
    const pin = hoveredBoardPin && hoveredBoardPin.type !== 'psram'
      ? { id: `board_${hoveredBoardPin.id}`, cx: hoveredBoardPin.cx, cy: hoveredBoardPin.cy, boardPin: hoveredBoardPin }
      : (hoveredBoardPin ? null : this._findPinAt(x, y)); // fallback to comp pins
    const newHover = hoveredBoardPin ? `board_${hoveredBoardPin.id}` : (pin ? pin.id : null);
    if (newHover !== this.hoveredPinId) {
      this.hoveredPinId = newHover;
      _dirty = true;
      if (hoveredBoardPin) {
        // Show tooltip for all board pins including PSRAM
        this._showTooltip(
          hoveredBoardPin.type !== 'psram'
            ? { id: `board_${hoveredBoardPin.id}`, cx: hoveredBoardPin.cx, cy: hoveredBoardPin.cy, boardPin: hoveredBoardPin }
            : null,
          e.clientX, e.clientY
        );
        // For PSRAM pins, manually set the label in tooltip
        if (hoveredBoardPin.type === 'psram') {
          this.tooltip.textContent = `${hoveredBoardPin.label}  GPIO${hoveredBoardPin.num}  ⚠ Reserved — Octal PSRAM (N16R8)`;
          this.tooltip.classList.add('visible');
          this.tooltip.style.left = e.clientX + 'px';
          this.tooltip.style.top  = e.clientY + 'px';
        }
      } else if (pin) {
        this._showTooltip(pin, e.clientX, e.clientY);
      } else {
        this.tooltip.classList.remove('visible');
      }
    }

    if (this.wireFrom || this.dragging) _dirty = true;
  }

  _onUp(e) {
    if (this.dragging) {
      this.dragging = null;
      _dirty = true;
    }
    // Release button
    for (const c of this.components) {
      if (c.type === 'Button' && c.pressed) {
        c.pressed = false;
        this.evaluator.updateButtonPins();
        _dirty = true;
      }
    }
  }

  _onContext(e) {
    e.preventDefault();
    const { x, y } = this._canvasPos(e);

    // Cancel wire
    if (this.wireFrom) {
      this.wireFrom = null;
      this.canvas.classList.remove('wiring');
      _dirty = true;
      return;
    }

    // Delete wire near click
    const wireIdx = this._findWireAt(x, y);
    if (wireIdx >= 0) {
      this.wires.splice(wireIdx, 1);
      _dirty = true;
      return;
    }

    // Delete component
    const comp = this._findCompAt(x, y);
    if (comp) {
      this._deleteComp(comp);
      _dirty = true;
    }
  }

  _onWheel(e) {
    const { x, y } = this._canvasPos(e);
    // Scroll potentiometer
    const comp = this._findCompAt(x, y);
    if (comp && comp.type === 'Potentiometer') {
      e.preventDefault();
      comp.value = Math.max(0, Math.min(1, comp.value - e.deltaY * 0.003));
      _dirty = true;
    }
  }

  // ---- COMPONENT PLACEMENT ----
  _placeComp(type, x, y) {
    let comp;
    switch (type) {
      case 'led-red':     comp = new LED(x, y, '#ff4444'); break;
      case 'led-green':   comp = new LED(x, y, '#44ff66'); break;
      case 'led-blue':    comp = new LED(x, y, '#448aff'); break;
      case 'led-yellow':  comp = new LED(x, y, '#ffcc00'); break;
      case 'resistor-220':  comp = new Resistor(x, y, 220);   break;
      case 'resistor-1k':   comp = new Resistor(x, y, 1000);  break;
      case 'resistor-10k':  comp = new Resistor(x, y, 10000); break;
      case 'button':        comp = new PushButton(x, y);      break;
      case 'buzzer':        comp = new Buzzer(x, y);          break;
      case 'potentiometer': comp = new Potentiometer(x, y);   break;
      default: return;
    }
    this.components.push(comp);
  }

  _deleteComp(comp) {
    this.components = this.components.filter(c => c !== comp);
    this.wires = this.wires.filter(w => !w.fromId.startsWith(comp.id) && !w.toId.startsWith(comp.id));
    this.evaluator.components = this.components;
    this.evaluator.wires = this.wires;
  }

  // ---- WIRING ----
  _completeWire(toPin) {
    const from = this.wireFrom;
    this.wireFrom = null;
    this.canvas.classList.remove('wiring');

    if (from.id === toPin.id) return; // same pin

    // Avoid duplicate wire
    const dup = this.wires.find(w =>
      (w.fromId === from.id && w.toId === toPin.id) ||
      (w.fromId === toPin.id && w.toId === from.id)
    );
    if (dup) return;

    const wire = {
      id:     `wire_${Date.now()}`,
      fromId: from.id,
      toCx:   null, // resolved each frame
      fromCx: from.cx,
      fromCy: from.cy,
      toId:   toPin.id,
      toCx:   toPin.cx,
      toCy:   toPin.cy,
      color:  WIRE_COLORS[this.wires.length % WIRE_COLORS.length],
    };
    this.wires.push(wire);
    this.evaluator.wires = this.wires;
  }

  // Check if a wire is close to point (for delete)
  _findWireAt(mx, my) {
    for (let i = this.wires.length - 1; i >= 0; i--) {
      const w = this.wires[i];
      const { fx, fy, tx, ty } = this._wireCoords(w);
      // Check proximity to bezier midpoint (approx)
      const midX = (fx + tx) / 2;
      const midY = (fy + ty) / 2;
      if (Math.hypot(mx - midX, my - midY) < 18) return i;
      // Also check segments
      if (Math.hypot(mx - fx, my - fy) < 18) return i;
      if (Math.hypot(mx - tx, my - ty) < 18) return i;
    }
    return -1;
  }

  // Resolve wire endpoint coordinates (dynamic since comps move)
  _wireCoords(wire) {
    const resolvePin = (id) => {
      if (id.startsWith('board_')) {
        const pinId = id.slice('board_'.length);
        const bp = this.boardPins.find(p => p.id === pinId);
        return bp ? { cx: bp.cx, cy: bp.cy } : null;
      }
      for (const comp of this.components) {
        const pins = comp.absPins();
        const p = pins.find(ap => ap.id === id);
        if (p) return { cx: p.cx, cy: p.cy };
      }
      return null;
    };
    const from = resolvePin(wire.fromId);
    const to   = resolvePin(wire.toId);
    return {
      fx: from ? from.cx : wire.fromCx,
      fy: from ? from.cy : wire.fromCy,
      tx: to   ? to.cx   : wire.toCx,
      ty: to   ? to.cy   : wire.toCy,
    };
  }

  // ---- SIM CONTROL ----
  _runSim() {
    if (this.interp.running) return;
    const code = document.getElementById('code-editor').value;
    this.serial.clear();
    this.serial.appendLine('[ESP32-S3] Simulation started', 'info');
    this._setStatus('running', 'Running…');
    document.getElementById('btn-run').disabled  = true;
    document.getElementById('btn-stop').disabled = false;

    this.interp.run(code).then(() => {
      this._setStatus('idle', 'Stopped');
      document.getElementById('btn-run').disabled  = false;
      document.getElementById('btn-stop').disabled = true;
      _dirty = true;
    });
  }

  _stopSim() {
    this.interp.stop();
    this._setStatus('idle', 'Ready');
    document.getElementById('btn-run').disabled  = false;
    document.getElementById('btn-stop').disabled = true;
    _dirty = true;
  }

  _clearCanvas() {
    if (this.interp.running) this._stopSim();
    this.components = [];
    this.wires = [];
    this.evaluator.components = this.components;
    this.evaluator.wires = this.wires;
    this.wireFrom = null;
    _dirty = true;
  }

  _setStatus(state, text) {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    dot.className = 'status-dot ' + (state === 'running' ? 'running' : state === 'error' ? 'error' : '');
    txt.textContent = text;
  }

  // ---- TOOLTIP ----
  _showTooltip(pin, clientX, clientY) {
    let label = '';
    if (pin && pin.boardPin) {
      const bp = pin.boardPin;
      label = bp.label;
      if (bp.type === 'gpio')     label += `  GPIO${bp.num}`;
      if (bp.type === 'psram')    label += `  GPIO${bp.num}  ⚠ Reserved — Octal PSRAM (N16R8)`;
      if (bp.type === 'power3v3') label += '  3.3V';
      if (bp.type === 'power5v')  label += '  5V';
      if (bp.type === 'gnd')      label += '  GND';
    } else if (pin && pin.comp) {
      const absPin = pin.comp.absPins().find(p => p.id === pin.id);
      label = `${pin.comp.type} · ${absPin ? absPin.label || absPin.name : ''}`;
    } else {
      // PSRAM-only hover (no pin object passed)
      for (const bp of this.boardPins) {
        if (bp.type === 'psram' && bp.id === this.hoveredPinId?.replace('board_','')) {
          label = `${bp.label}  GPIO${bp.num}  ⚠ Reserved — Octal PSRAM (N16R8)`;
          break;
        }
      }
    }
    this.tooltip.textContent = label;
    this.tooltip.style.left = clientX + 'px';
    this.tooltip.style.top  = clientY + 'px';
    this.tooltip.classList.add('visible');
  }

  // ---- RENDER ----
  _renderLoop() {
    const frame = () => {
      if (_dirty || this.interp.running) {
        this._render();
        _dirty = false;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  _render() {
    const ctx = this.ctx;
    const W = CANVAS_W, H = CANVAS_H;

    // Background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, W, H);

    // Grid
    this._drawGrid(ctx, W, H);

    // Update button overrides
    if (this.interp.running) {
      this.evaluator.updateButtonPins();
    }

    // Evaluate circuit
    const compResults = new Map();
    for (const comp of this.components) {
      compResults.set(comp.id, this.evaluator.evalComponent(comp));
    }

    // Draw wires (behind components)
    for (const wire of this.wires) {
      this._drawWire(ctx, wire);
    }

    // Preview wire being drawn
    if (this.wireFrom) {
      this._drawWirePreview(ctx);
    }

    // Draw components
    for (const comp of this.components) {
      const result = compResults.get(comp.id) || { powered: false, brightness: 0 };
      comp.draw(ctx, result.powered, result.brightness);
      comp.drawPins(ctx, this.hoveredPinId);
    }

    // Draw board (on top of wires behind it but below labels)
    drawBoard(ctx, this.boardPins, this.pinStates, this.hoveredPinId);
  }

  _drawGrid(ctx, W, H) {
    ctx.strokeStyle = 'rgba(20,40,80,0.6)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += GRID) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += GRID) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    // Dots at intersections
    ctx.fillStyle = 'rgba(30,60,120,0.5)';
    for (let gx = 0; gx < W; gx += GRID) {
      for (let gy = 0; gy < H; gy += GRID) {
        ctx.fillRect(gx - 0.5, gy - 0.5, 1, 1);
      }
    }
  }

  _drawWire(ctx, wire) {
    const { fx, fy, tx, ty } = this._wireCoords(wire);
    ctx.save();
    ctx.strokeStyle = wire.color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 5;
    ctx.shadowColor = wire.color;

    const dx = Math.abs(tx - fx);
    const ctrl = Math.max(dx * 0.55, 50);

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.bezierCurveTo(fx + ctrl, fy, tx - ctrl, ty, tx, ty);
    ctx.stroke();
    ctx.restore();

    // Endpoint dots
    ctx.fillStyle = wire.color;
    ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx, ty, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  _drawWirePreview(ctx) {
    const { cx: fx, cy: fy } = this.wireFrom;
    const { x: tx, y: ty }   = this.mousePos;

    ctx.save();
    ctx.strokeStyle = '#00d4aa';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.lineCap = 'round';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00d4aa';

    const dx = Math.abs(tx - fx);
    const ctrl = Math.max(dx * 0.55, 50);

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.bezierCurveTo(fx + ctrl, fy, tx - ctrl, ty, tx, ty);
    ctx.stroke();
    ctx.restore();
  }
}

// ----------------------------------------------------------------
// INIT
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  window._sim = new SimulatorApp();
});
