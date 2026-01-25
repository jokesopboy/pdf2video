<div align="center">

# 📄 pdf2video

**Transform PDF documents into engaging video presentations with smooth animations.**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Remotion](https://img.shields.io/badge/Remotion-4.0-purple.svg)](https://www.remotion.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

[Features](#features) • [Quick Start](#quick-start) • [Configuration](#configuration) • [Demo](#demo)

---

</div>

## Demo

https://github.com/user-attachments/assets/464622be-c855-42c6-bc9e-988350906d92

## Features

- **Multiple Scene Types**
  - `stack` - Card stack display with entrance animation
  - `focus` - Extract and zoom into a specific page with scroll support
  - `switch` - Smooth page transitions with slide animations
  - `fan` - Fan/wheel layout with rotation and focus effects

- **Smart Animations**
  - Natural card spread when focusing (like poker cards)
  - Breathing effect before scrolling
  - Bounce effect at scroll stop
  - Collapse animation for seamless scene transitions

- **Title System**
  - Main title + subtitle at opening
  - Persistent corner title during page viewing
  - Per-page custom titles

- **Bottom Info Bar**
  - Scene title with typing effect for descriptions
  - Progress indicator (1/5 format)
  - Customizable per-page descriptions

- **Ending Scene**
  - PDF stack moves to left with staggered cards
  - "Thank you" message with title on right
  - Animated decoration line

- **Dynamic Duration**
  - Auto-calculates video length from script configuration

- **Background Music**
  - Auto fade-in/fade-out (2 seconds each)
  - Duration matches video length automatically

- **High Quality Rendering**
  - Focus pages render at 2x resolution for sharp zoom

## Quick Start

### Installation

```bash
npm install
```

### Add Your Files

Place your PDF and background music in the `public/` folder:

```bash
# PDF document
cp /path/to/your/document.pdf public/sample.pdf

# Background music (optional)
cp /path/to/your/music.mp3 public/background.mp3
```

### Development Preview

```bash
npm run dev

# Preview with custom props
npx remotion preview --props=./props/example.json
```

### Render Video

```bash
npm run build

# Render with custom props
npx remotion render PdfShowcase out/example.mp4 --props=./props/example.json
```

## Configuration

### Basic Props

```tsx
{
  src: "/sample.pdf",           // PDF file path (in public folder)
  title: "Document Title",       // Main title
  subtitle: "Subtitle",          // Optional subtitle
  highlights: [1, 3, 5],        // Pages to showcase
  pageTitles: {                 // Per-page titles
    "1": "Cover",
    "3": "Key Points",
    "5": "Summary",
  },
  pageDescriptions: {           // Per-page descriptions (typing effect)
    "1": "Introduction to the document...",
    "3": "The core findings are...",
    "5": "In conclusion...",
  },
}
```

### Custom Script

Full control over the presentation flow:

```tsx
{
  src: "/sample.pdf",
  title: "Custom Flow",
  script: [
    { type: "stack", duration: 60 },            // Stack display
    { type: "focus", page: 1, duration: 120 },  // Focus page 1
    { type: "switch", page: 3, duration: 120 }, // Switch to page 3
    { type: "fan", page: 5, duration: 150 },    // Fan mode for page 5
    { type: "stack", duration: 120 },           // Ending stack
  ],
}
```

### Script Item Types

| Type | Description | Default Duration |
|------|-------------|------------------|
| `stack` | Card stack display | 60 frames |
| `focus` | Zoom into a page | 120 frames |
| `switch` | Slide transition | 120 frames |
| `fan` | Fan wheel layout | 150 frames |

## Example Configurations

### Standard Mode

```json
{
  "src": "/sample.pdf",
  "title": "Technical Report",
  "subtitle": "Key Insights",
  "highlights": [1, 3, 9, 14, 20],
  "pageTitles": {
    "1": "Abstract",
    "3": "Architecture",
    "9": "Training",
    "14": "Results",
    "20": "Conclusion"
  },
  "pageDescriptions": {
    "1": "Overview of the technical approach...",
    "3": "The system architecture consists of...",
    "9": "Training process involves...",
    "14": "Benchmark results show...",
    "20": "Key takeaways include..."
  }
}
```

### Fan Mode

```json
{
  "src": "/sample.pdf",
  "title": "Technical Report",
  "subtitle": "Key Insights",
  "script": [
    { "type": "stack", "duration": 60 },
    { "type": "fan", "page": 1, "duration": 150 },
    { "type": "fan", "page": 3, "duration": 150 },
    { "type": "fan", "page": 9, "duration": 150 },
    { "type": "stack", "duration": 120 }
  ]
}
```

## Claude Code Skill

This project includes a Claude Code skill (`.claude/skills/pdf-to-video/`) for automated PDF to video conversion.

### Setup

The skill is already in the correct location. If you want to use it globally, copy to your home directory:

```bash
cp -r .claude/skills/pdf-to-video ~/.claude/skills/
```

### Usage

Once installed, simply tell Claude:

> "帮我把这个 PDF 转成展示视频：/path/to/document.pdf"

Claude will:
1. Read and analyze the PDF content
2. Extract key points and page titles
3. Generate props.json configuration
4. Render the video automatically

## Project Structure

```
├── props/                      # Props configuration files
│   └── example.json            # Example: props/glm45.json
├── public/                     # Static assets
│   ├── *.pdf                   # PDF source files
│   └── background.mp3          # Background music
├── out/                        # Rendered video output
│   └── example.mp4             # Example: out/glm45.mp4
└── src/
    ├── index.ts                # Entry point
    ├── Root.tsx                # Remotion root component
    └── templates/
        ├── Blank.tsx           # Blank template
        └── PdfShowcase/        # PDF showcase template
            ├── index.tsx       # Main component
            ├── types.ts        # Type definitions
            ├── PdfPage.tsx     # PDF page renderer
            ├── StackScene.tsx  # Stack scene
            ├── FocusScene.tsx  # Focus scene
            ├── SwitchScene.tsx # Switch scene
            ├── FanScene.tsx    # Fan scene
            ├── GridBackground.tsx  # Animated grid background
            ├── PersistentTitle.tsx # Persistent title component
            ├── BottomInfo.tsx  # Bottom info bar
            └── EndingOverlay.tsx   # Ending overlay
```

## Video Specs

- Resolution: 1920 x 1080
- Frame Rate: 30 fps
- Duration: Dynamic (based on script)

## Tech Stack

- [Remotion](https://www.remotion.dev/) - React video framework
- [react-pdf](https://github.com/wojtekmaj/react-pdf) - PDF rendering
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) - PDF parsing
- [Zod](https://zod.dev/) - Schema validation

---

<div align="center">

## Author

Created by **[@JinsFavorites](https://x.com/JinsFavorites)**

If you find this useful, give it a ⭐️!

[![Twitter Follow](https://img.shields.io/twitter/follow/JinsFavorites?style=social)](https://x.com/JinsFavorites)

</div>

## License

MIT
