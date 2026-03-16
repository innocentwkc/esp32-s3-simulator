ESP32-S3-N16R8 Simulator
========================

A browser-based simulator for the **ESP32-S3-N16R8 DevKitC-1** that lets you design circuits, write Arduino-style code, and run live simulations — no physical hardware required. This project is **specifically built and tuned for the ESP32-S3-N16R8 variant** (16MB Flash, 8MB OPI PSRAM).

Features
--------

- **Visual circuit builder**: Drag LEDs, resistors, buttons, buzzers, and a potentiometer onto a canvas and wire them to a rendered **ESP32-S3-DevKitC-1 N16R8** board.
- **Accurate ESP32-S3-N16R8 pinout**: Board graphics and pin labels match the official ESP32-S3-DevKitC-1 (N16R8) pinout, including power rails, grounds, GPIOs, USB, JTAG, and strapping pins.
- **Arduino-compatible code execution**:
  - Supports `setup()` / `loop()`
  - Core APIs like `pinMode`, `digitalWrite`, `digitalRead`, `analogRead`, `analogWrite`, `delay`, `Serial.print/println`, and common math/bit helpers.
- **Live simulation**:
  - LEDs glow with PWM-based brightness.
  - Buttons can be pressed while the sim is running.
  - Potentiometer value is controlled via mouse wheel and read with `analogRead`.
  - Buzzer emits audio beeps when powered.
- **Serial monitor**: Built-in monitor shows `Serial.print` and `Serial.println` output similar to the Arduino IDE.
- **Simulation controls**:
  - Run / Stop
  - Adjustable speed (0.25×–10×)
  - Zoom in/out/fit for the canvas
  - Clear canvas and clear serial output

Project Structure
-----------------

- `index.html` – Landing page that explains the simulator and links to the main simulation UI.
- `simulator.html` – Main simulator UI (toolbar, component palette, canvas, editor, serial monitor).
- `js/app.js` – All simulator logic: board rendering, components, wiring, Arduino interpreter, and simulation loop.
- `css/main.css` – Styles for the landing page.
- `css/simulator.css` – Styles for the simulator UI.
- `esp32-s3-n16r8.webp` – ESP32-S3-N16R8 board artwork used in the UI.

Getting Started
---------------

### Prerequisites

The simulator is pure HTML/CSS/JS and does not require a backend. Any static HTTP server is enough.

You can use, for example:

- **Node.js:** `npx serve .`
- **Python 3:** `python -m http.server 8000`
- **VS Code Live Server** or any other static file server.

### Running Locally

From the project root:

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node (if you have it)
npx serve .
```

Then open in your browser:

- `http://localhost:8000/index.html` – Landing page
- `http://localhost:8000/simulator.html` – Simulator directly

The app is designed to work fully client-side and will also work offline after the first load in most modern browsers.

Using the Simulator
-------------------

1. **Open the simulator**

   - From `index.html`, click **“Open Simulator →”** or **“Launch Simulator →”**, or navigate directly to `simulator.html`.

2. **Place components**

   - Use the **Components** palette on the left.
   - Click a component (e.g., **Red LED**, **Resistor 220Ω**, **Pushbutton**, **Buzzer**, **Potentiometer**).
   - Click on the canvas to place it.
   - Drag to reposition components (only when the simulation is stopped).
   - Right-click a component to delete it.

3. **Wire the circuit**

   - Click on a board pin or component pin to start a wire.
   - Click a second pin to complete the connection.
   - Right-click near a wire to delete it.
   - Pins glow and show tooltips with pin numbers and functions (e.g., `GPIO4`, `ADC1_3`, `TOUCH4`).

4. **Write code**

   - Use the **Code Editor** panel on the right.
   - There is a default `sketch.ino` blink example using `GPIO4` and `Serial` on the ESP32-S3-N16R8.
   - Supports Arduino-style C++-like syntax; it’s transpiled to JavaScript and executed in an async loop.

5. **Run the simulation**

   - Click **Run** (or press **Ctrl+Enter** in the editor).
   - Use the **Speed** dropdown to adjust the simulation speed.
   - Watch components respond on the canvas and see logs in the **Serial Monitor**.
   - Click **Stop** to stop execution and reset pin states.

Supported Arduino API (subset)
------------------------------

The interpreter provides a JavaScript-backed subset of Arduino APIs, including (but not limited to):

### Core

- `setup()`, `loop()`
- `pinMode(pin, mode)`
- `digitalWrite(pin, value)`
- `digitalRead(pin)`
- `analogWrite(pin, value)` (0–255, drives LED brightness)
- `analogRead(pin)` (reads from connected potentiometer wiper as 0–4095)
- `delay(ms)`, `delayMicroseconds(us)`
- `millis()`, `micros()`

### Serial

- `Serial.begin(baud)`
- `Serial.print(value)`
- `Serial.println(value)`
- `Serial.available()`, `Serial.read()`, `Serial.flush()`, `Serial.write(byte)`

### Math & helpers

- Common math functions (`sin`, `cos`, `sqrt`, `pow`, etc.), `map`, `constrain`, `random`, bit operations, and type-like helpers (`String`, `int`, `float`, `byte`, etc.).

ESP32-S3-N16R8 Pinout Notes
---------------------------

The simulator uses an authoritative GPIO capability table tailored to the **ESP32-S3-DevKitC-1 N16R8**:

- **Analog inputs** via ADC1/ADC2 (`analogRead`) on ADC-capable GPIOs.
- **PWM outputs** via `analogWrite` on output-capable GPIOs.
- **Special pins**:
  - GPIO0, 3, 45, 46 are **strapping** / special-function pins.
  - GPIO19/20 are **USB D- / D+**.
  - GPIO43/44 default to **UART0 TX/RX**.
- Some pins are **input-only** (e.g., GPIO46) or reserved for memory buses; the visuals and tooltips reflect those roles.

Refer to the official Espressif documentation for deep hardware details, but the simulator makes these differences visible and discoverable via tooltips and pin labels.

Keyboard & Mouse Shortcuts
---------------------------

- **Run code**: `Ctrl+Enter` in the code editor.
- **Insert indentation**: `Tab` inserts spaces in the editor.
- **Zoom**:
  - `Ctrl + +` / `Ctrl + -` to zoom in/out.
  - `Ctrl + 0` to fit the canvas.
  - Mouse wheel + `Ctrl` to zoom.
- **Potentiometer**: Scroll the mouse wheel over it to change its value.
- **Button**: Click while simulation is running to momentarily press it.

Development
-----------

This is a single-page, client-side app with no build step:

- Edit `index.html`, `simulator.html`, and `css/*.css` for layout and styles.
- Edit `js/app.js` for:
  - Board rendering and pin definitions
  - Component classes (LED, Resistor, Button, Buzzer, Potentiometer)
  - Circuit evaluator and Arduino interpreter
  - Input handling (wiring, dragging, zoom, etc.)

No external dependencies are required beyond a modern browser.

License
-------

This project is licensed under the MIT License – see the `LICENSE` file for details.

