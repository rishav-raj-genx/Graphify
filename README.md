# Image-to-GitHub Graph

A sleek, modern web utility that converts any image into a pixelated heatmap styled exactly like a GitHub contribution graph. Built with Next.js 16, React 19, Tailwind CSS v4, and Framer Motion. 

## Features
- **Client-Side Processing**: Fast and secure image processing using purely HTML5 Canvas API—no external image libraries.
- **Customizable Resolution**: Adjust the number of blocks to match your desired detail level.
- **Contrast Adjustment**: Pull out details from washed-out images with a contrast slider.
- **Theming**: Toggle between classic Green, Halloween (Orange), and Winter (Blue) themes.
- **Dark & Light Modes**: Seamless integration with GitHub's native background colors.
- **Invert Colors**: Flip the luminance mapping for creative effects.
- **Export Options**: Download as high-quality PNG or SVG (perfect for crisp embedding in GitHub Profile READMEs).
- **Web Share**: Instantly share the processed image using native device capabilities.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Getting Started

First, install dependencies using pnpm:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Drag and drop an image or upload one to get started!

## Deployment
Easily deployable on Vercel or any Next.js compatible hosting service.
