import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

interface PitchPoint {
  time: number;
  frequency: number;
  note: string;
  octave: number;
  cents: number;
}

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>("");
  const [currentFrequency, setCurrentFrequency] = useState<number>(0);
  const [currentCents, setCurrentCents] = useState<number>(0);
  const [pitchHistory, setPitchHistory] = useState<PitchPoint[]>([]);
  const [transpose, setTranspose] = useState(0);
  const [showTranspose, setShowTranspose] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Note frequencies (A4 = 440Hz)
  const noteFrequencies: { [key: string]: number } = {
    C: 261.63,
    "C#": 277.18,
    D: 293.66,
    "D#": 311.13,
    E: 329.63,
    F: 349.23,
    "F#": 369.99,
    G: 392.0,
    "G#": 415.3,
    A: 440.0,
    "A#": 466.16,
    B: 493.88,
  };

  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  // Convert frequency to note, octave, and cents with improved resolution
  const frequencyToNote = useCallback(
    (frequency: number): { note: string; octave: number; cents: number } => {
      if (frequency < 20) return { note: "", octave: 0, cents: 0 };

      // A4 = 440Hz, which is in octave 4
      const a4 = 440;
      const c0 = a4 * Math.pow(2, -4.75); // C0 frequency

      // Use more precise calculation for better resolution
      const halfStepsBelowMiddleC = 12 * Math.log2(frequency / c0);
      const octave = Math.floor(halfStepsBelowMiddleC / 12);
      const noteIndex = Math.round(((halfStepsBelowMiddleC % 12) + 12) % 12);

      // Calculate cents deviation with higher precision
      const nearestNoteFreq =
        noteFrequencies[noteNames[noteIndex]] * Math.pow(2, octave - 4);
      const cents = Math.round(1200 * Math.log2(frequency / nearestNoteFreq));

      return { note: noteNames[noteIndex], octave, cents };
    },
    [noteFrequencies, noteNames]
  );

  // Apply transpose to frequency
  const applyTranspose = useCallback(
    (frequency: number): number => {
      if (transpose === 0) return frequency;
      return frequency * Math.pow(2, transpose / 12);
    },
    [transpose]
  );

  // Get transposed note name
  const getTransposedNoteName = useCallback(
    (baseNote: string, baseOctave: number): string => {
      if (transpose === 0) return `${baseNote}${baseOctave}`;

      const noteIndex = noteNames.indexOf(baseNote);
      const newNoteIndex = (noteIndex + transpose + 12) % 12;
      const octaveShift = Math.floor((noteIndex + transpose) / 12);
      const newOctave = baseOctave + octaveShift;

      return `${noteNames[newNoteIndex]}${newOctave}`;
    },
    [transpose, noteNames]
  );

  // Pitch detection using autocorrelation with decreased sensitivity
  const detectPitch = useCallback(
    (buffer: Float32Array, sampleRate: number): number => {
      const bufferLength = buffer.length;
      const correlationBuffer = new Float32Array(bufferLength);

      // Autocorrelation algorithm optimized for voice
      for (let lag = 0; lag < bufferLength; lag++) {
        let sum = 0;
        for (let i = 0; i < bufferLength - lag; i++) {
          sum += buffer[i] * buffer[i + lag];
        }
        correlationBuffer[lag] = sum;
      }

      // Find the first peak after the initial drop with increased threshold
      let maxCorrelation = 0;
      let maxLag = 0;
      const threshold = 0.1; // Increased threshold for decreased sensitivity

      // Skip the first few samples (DC component)
      for (let lag = 50; lag < bufferLength / 2; lag++) {
        if (
          correlationBuffer[lag] > maxCorrelation &&
          correlationBuffer[lag] > threshold
        ) {
          maxCorrelation = correlationBuffer[lag];
          maxLag = lag;
        }
      }

      if (maxLag === 0) return 0;

      // Use parabolic interpolation for better frequency resolution
      let refinedLag = maxLag;
      if (maxLag > 0 && maxLag < bufferLength - 1) {
        const left = correlationBuffer[maxLag - 1];
        const center = correlationBuffer[maxLag];
        const right = correlationBuffer[maxLag + 1];

        // Parabolic interpolation to find the true peak
        const delta = (0.5 * (left - right)) / (left - 2 * center + right);
        refinedLag = maxLag + delta;
      }

      // Convert lag to frequency with higher precision
      const frequency = sampleRate / refinedLag;

      // Filter for human voice range (80Hz - 800Hz) with stricter bounds
      if (frequency >= 85 && frequency <= 750) {
        return frequency;
      }

      return 0;
    },
    []
  );

  // Get color for cents display based on deviation
  const getCentsColor = useCallback((cents: number): string => {
    const absCents = Math.abs(cents);
    if (absCents <= 15) {
      return "#22c55e"; // Green for in-tune (within 15 cents)
    } else if (absCents <= 30) {
      return "#f97316"; // Orange for slightly off (15-30 cents)
    } else {
      return "#ef4444"; // Red for significantly off (beyond 30 cents)
    }
  }, []);

  // Format cents with two digits
  const formatCents = useCallback((cents: number): string => {
    const absCents = Math.abs(cents);
    const sign = cents >= 0 ? "+" : "-";
    return `${sign}${absCents.toString().padStart(2, "0")}¢`;
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const audioContext = audioContextRef.current;

      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 4096; // Increased from 2048 for better resolution
      analyserRef.current.smoothingTimeConstant = 0.85; // Slightly reduced for better responsiveness

      microphoneRef.current = audioContext.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      startTimeRef.current = Date.now();

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);

      const updatePitch = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(dataArray);
        const frequency = detectPitch(dataArray, audioContext.sampleRate);

        if (frequency > 0) {
          const transposedFreq = applyTranspose(frequency);
          const { note, octave, cents } = frequencyToNote(transposedFreq);

          setCurrentFrequency(transposedFreq);
          setCurrentNote(note);
          setCurrentCents(cents);

          // Add to pitch history more frequently
          const currentTime = (Date.now() - startTimeRef.current) / 1000;
          const newPoint: PitchPoint = {
            time: currentTime,
            frequency: transposedFreq,
            note,
            octave,
            cents,
          };

          setPitchHistory((prev) => {
            const updated = [...prev, newPoint];
            // Keep more data points (last 15 seconds instead of 10)
            return updated.filter((point) => currentTime - point.time < 15);
          });
        }

        animationFrameRef.current = requestAnimationFrame(updatePitch);
      };

      updatePitch();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to use the pitch detector");
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsListening(false);
    setCurrentNote("");
    setCurrentFrequency(0);
    setCurrentCents(0);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Calculate Y position for graph (loops every octave)
  const getGraphY = (frequency: number): number => {
    if (frequency < 20) return 0;
    const octave = Math.log2(frequency / 440) + 4; // A4 = 440Hz, octave 4
    return (octave % 1) * 400; // 400px height per octave
  };

  // Get rainbow color based on Y position
  const getRainbowColor = (y: number): string => {
    const hue = (y / 400) * 360; // Convert Y position to hue (0-360)
    return `hsl(${hue}, 70%, 60%)`;
  };

  // Generate note grid lines with labels
  const generateNoteGrid = () => {
    const elements = [];
    const noteSpacing = 400 / 12; // 400px / 12 notes per octave

    for (let i = 0; i <= 12; i++) {
      const y = i * noteSpacing;
      // Start with A at the bottom (i=0) and progress upward
      const noteIndex = i === 0 ? 9 : i === 12 ? 9 : (9 - i + 12) % 12; // A=9, so we work backwards
      const noteName = noteNames[noteIndex];
      const octave = 4; // Middle octave for reference

      elements.push(
        <line
          key={`note-line-${i}`}
          x1="0"
          y1={y}
          x2="100%"
          y2={y}
          stroke="#e0e0e0"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      );

      // Add note labels on the left side
      if (i < 12) {
        // Don't repeat the last line
        const transposedNote = getTransposedNoteName(noteName, octave);
        elements.push(
          <text
            key={`note-label-${i}`}
            x="5"
            y={y + noteSpacing / 2 + 4}
            fontSize="12"
            fill="#666"
            fontFamily="monospace"
            textAnchor="start"
          >
            {transposedNote}
          </text>
        );
      }
    }
    return elements;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h3>🎵 Honest to Goodness Pitch Detector</h3>
      </header>

      <main className="App-main">
        <div className="pitch-display">
          <div className="pitch-row">
            <button
              className={`listen-button ${isListening ? "listening" : ""}`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? "🛑 Stop" : "🎤 Start"}
            </button>

            <div className="current-note">
              <div className="note-row">
                <span className="note-text">{currentNote || "--"}</span>
                <span
                  className="cents-text"
                  style={{
                    color:
                      currentCents !== 0
                        ? getCentsColor(currentCents)
                        : "inherit",
                  }}
                >
                  {currentCents !== 0 ? formatCents(currentCents) : ""}
                </span>
                {currentFrequency > 0 ? (
                  <span className="frequency-text">
                    {`${currentFrequency.toFixed(1)} Hz`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="pitch-graph">
          <div className="graph-header">
            <h3>Pitch Over Time</h3>
            <button
              className="clear-button"
              onClick={() => setPitchHistory([])}
            >
              🗑️ Clear
            </button>
          </div>
          <div className="graph-container">
            <svg width="100%" height="400" className="graph">
              <defs>
                <pattern
                  id="note-grid"
                  patternUnits="userSpaceOnUse"
                  width="100%"
                  height="400"
                >
                  {generateNoteGrid()}
                </pattern>
              </defs>

              <rect width="100%" height="400" fill="url(#note-grid)" />

              {pitchHistory.map((point, index) => (
                <circle
                  key={index}
                  cx={`${((point.time % 15) / 15) * 100}%`}
                  cy={400 - getGraphY(point.frequency)}
                  r="2"
                  fill={getRainbowColor(getGraphY(point.frequency))}
                  opacity="0.8"
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="transpose-section">
          <button
            className="transpose-toggle"
            onClick={() => setShowTranspose(!showTranspose)}
          >
            I'm totally not lying to you
          </button>

          {showTranspose && (
            <div className="transpose-controls">
              <label htmlFor="transpose-slider">
                Transpose: {transpose > 0 ? `+${transpose}` : transpose}{" "}
                semitones
              </label>
              <input
                id="transpose-slider"
                type="range"
                min="-12"
                max="12"
                value={transpose}
                onChange={(e) => setTranspose(parseInt(e.target.value))}
                className="transpose-slider"
              />
              <button
                className="reset-transpose"
                onClick={() => setTranspose(0)}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
