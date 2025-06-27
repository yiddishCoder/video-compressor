# Developer Notes for Video Compressor

## Features

- **Input Video Selection**: Choose video files via native file picker or drag-and-drop
- **Output File Selection**: Select where to save the encoded video with overwrite confirmation
- **Resolution Control**: Automatically detect source resolution and offer compatible downscaling options
- **CRF Control**: Constant Rate Factor settings from 18-28 for fine-tuned quality control
- **Encoding Presets**: 10 different encoding presets from ultrafast to veryslow for quality/speed trade-offs
- **Real-time Progress**: Live progress bar showing encoding status
- **Cross-platform**: Works on Windows, macOS, and Linux

## Quality Control

### CRF (Constant Rate Factor)
The app provides CRF control with values from 18 to 28:
- **18-20**: High quality, larger file size
- **21-23**: Good quality, balanced compression
- **24-26**: Decent quality, smaller file size
- **27-28**: Lower quality, maximum compression

### Encoding Presets

| Preset | Description |
|--------|-------------|
| veryslow | Best quality, slowest encoding |
| slower | Very high quality, very slow |
| slow | High quality, slow encoding |
| medium | Good quality, balanced speed (default) |
| fast | Decent quality, faster encoding |
| faster | Lower quality, much faster |
| veryfast | Low quality, very fast |
| superfast | Very low quality, super fast |
| ultrafast | Lowest quality, ultra fast |

## Supported Video Formats

### Input Formats
- MP4, AVI, MOV, MKV, WMV, FLV, WebM

### Output Format
- MP4 (H.264 video, AAC audio)

## Development

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Build for specific platform
```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **Vue 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe JavaScript
- **FFmpeg**: Video processing and encoding
- **electron-vite**: Build tool for Electron + Vite

## License

MIT 