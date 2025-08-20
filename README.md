# 🎵 Honest Tuner - Voice Pitch Detection App

A real-time voice pitch detection application built with React and TypeScript that displays musical notes and visualizes pitch over time.

## 🚀 **Deployment**

### **GitHub Pages (Recommended)**

1. **Fork/Clone this repository**
2. **Update package.json**: Replace `YOUR_USERNAME` with your GitHub username
3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Setup for GitHub Pages"
   git push origin main
   ```
4. **Enable GitHub Pages**:
   - Go to your repository → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` → Save
5. **Deploy**: `npm run deploy`

**Live Demo**: [https://YOUR_USERNAME.github.io/honest-tuner](https://YOUR_USERNAME.github.io/honest-tuner)

### **Manual Deployment**

```bash
npm run build
npm run deploy
```

---

## 🎵 **Features**

- **Real-time Pitch Detection**: Uses Web Audio API with autocorrelation algorithm optimized for voice
- **Musical Note Display**: Shows the current note being sung with frequency in Hz
- **Live Pitch Graph**: Visualizes pitch over time with dots, looping every octave
- **Transpose Control**: Hidden section with slider to transpose displayed pitch up/down by semitones
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Performance Optimized**: Efficient audio processing with minimal latency

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Modern web browser with microphone access
- HTTPS connection (required for microphone access in most browsers)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd honest-tuner
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

5. Allow microphone access when prompted

## 🎤 How to Use

1. **Start Listening**: Click the "🎤 Start Listening" button
2. **Sing or Speak**: The app will detect your voice pitch in real-time
3. **View Results**: See the current note and frequency displayed prominently
4. **Watch the Graph**: Observe your pitch changes over time in the scrolling graph
5. **Transpose (Optional)**: Click "I'm totally not lying to you" to reveal transpose controls

## 🔧 Technical Details

### Pitch Detection Algorithm

- **Autocorrelation**: Implements autocorrelation for robust pitch detection
- **Voice Optimization**: Filtered for human voice range (80Hz - 800Hz)
- **Real-time Processing**: Uses Web Audio API with 2048 sample FFT
- **Low Latency**: Optimized for minimal delay between input and output

### Audio Processing

- **Sample Rate**: Adapts to system audio sample rate
- **Buffer Size**: 2048 samples for optimal accuracy vs. performance
- **Smoothing**: 0.8 smoothing constant for stable readings

### Graph Visualization

- **Octave Looping**: Y-axis loops every octave for intuitive pitch representation
- **Time Scrolling**: X-axis shows last 10 seconds of pitch data
- **Dot Rendering**: Individual pitch points rendered as small dots
- **Grid Lines**: Dashed lines showing octave boundaries

## 🎵 Musical Features

### Note Detection

- **12-Tone Equal Temperament**: Standard Western music notation
- **Octave Calculation**: Automatic octave detection from frequency
- **Transpose Support**: ±12 semitone range for pitch shifting

### Frequency Range

- **Human Voice**: Optimized for 80Hz - 800Hz range
- **Note Coverage**: C2 to G5 (approximately)
- **Accuracy**: ±1 semitone within optimal range

## 🎨 UI/UX Features

- **Modern Design**: Glassmorphism with backdrop blur effects
- **Responsive Layout**: Adapts to all screen sizes
- **Smooth Animations**: Hover effects and transitions
- **Color Coding**: Different colors for different states
- **Accessibility**: Proper contrast and readable fonts

## 🚨 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires HTTPS)
- **Edge**: Full support
- **Mobile**: Responsive design for touch devices

## 🔒 Privacy & Security

- **Local Processing**: All audio processing happens in the browser
- **No Data Collection**: No audio data is sent to external servers
- **Microphone Access**: Only requests microphone permission when needed
- **HTTPS Required**: Secure connection required for microphone access

## 🛠️ Development

### Project Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # Application styles
├── index.css        # Global styles
└── main.tsx         # Application entry point
```

### Key Components

- **Pitch Detection**: Custom autocorrelation algorithm
- **Audio Context**: Web Audio API management
- **Real-time Updates**: RequestAnimationFrame for smooth updates
- **State Management**: React hooks for app state
- **Responsive Design**: CSS Grid and Flexbox layout

### Performance Optimizations

- **Efficient Algorithms**: Optimized autocorrelation calculation
- **Memory Management**: Automatic cleanup of audio resources
- **Rendering Optimization**: Minimal DOM updates
- **Audio Buffering**: Efficient audio data handling

## 📱 Mobile Support

- **Touch Friendly**: Large buttons and controls
- **Responsive Design**: Adapts to mobile screen sizes
- **Performance**: Optimized for mobile devices
- **Audio Support**: Works with mobile microphones

## 🎯 Future Enhancements

- **Multiple Instruments**: Support for different instrument types
- **Recording**: Save pitch data for later analysis
- **Tuning Modes**: Different tuning systems (Just, Pythagorean)
- **Export Features**: Save graphs and data
- **Advanced Analytics**: Pitch stability and accuracy metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Web Audio API for audio processing capabilities
- React team for the excellent framework
- TypeScript for type safety
- Vite for fast development experience

---

**Note**: This app requires microphone access and works best with a quiet environment and clear vocal input. For best results, sing or speak clearly into your microphone.
