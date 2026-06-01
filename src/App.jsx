import { useState, useEffect, useRef, useCallback } from "react";
import './index.css'

const SIGNS = [
  { word: "HELLO", emoji: "👋", description: "Wave hand side to side" },
  { word: "THANK YOU", emoji: "🙏", description: "Flat hand from chin forward" },
  { word: "YES", emoji: "✊", description: "Fist nod up and down" },
  { word: "NO", emoji: "✌️", description: "Index & middle finger tap thumb" },
  { word: "HELP", emoji: "🤝", description: "Fist on flat palm, lift up" },
  { word: "PLEASE", emoji: "🖐️", description: "Flat hand circles on chest" },
  { word: "SORRY", emoji: "✊", description: "Fist circles on chest" },
  { word: "GOOD", emoji: "👍", description: "Flat hand from chin outward" },
  { word: "BAD", emoji: "👎", description: "Flat hand flips down" },
  { word: "WATER", emoji: "💧", description: "W-hand taps chin twice" },
  { word: "FOOD", emoji: "🍽️", description: "Bunched fingers tap lips" },
  { word: "LOVE", emoji: "❤️", description: "Crossed arms on chest" },
  { word: "FAMILY", emoji: "👨‍👩‍👧", description: "F-hands circle outward" },
  { word: "FRIEND", emoji: "🤟", description: "Hook index fingers together" },
  { word: "UNDERSTAND", emoji: "💡", description: "Flick index finger up from fist" },
];

const PHRASES = [
  "How are you?",
  "Nice to meet you",
  "I need help",
  "Thank you very much",
  "Can you repeat that?",
  "I don't understand",
  "Where is the bathroom?",
  "Call an ambulance",
];

// Animated hand landmark canvas
const HandCanvas = ({ isScanning, detectedSign, scanProgress }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const landmarks = [
      [0.5, 0.85],
      [0.35, 0.75], [0.28, 0.65], [0.22, 0.56], [0.18, 0.48],
      [0.42, 0.62], [0.38, 0.45], [0.36, 0.32], [0.35, 0.22],
      [0.5, 0.6],   [0.5, 0.42],  [0.5, 0.28],  [0.5, 0.18],
      [0.58, 0.62], [0.62, 0.45], [0.64, 0.32], [0.65, 0.22],
      [0.66, 0.67], [0.72, 0.54], [0.75, 0.44], [0.77, 0.36],
    ];

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    const draw = (t) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!isScanning && !detectedSign) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const pulse = Math.sin(t * 0.003) * 0.5 + 0.5;

      const animated = landmarks.map(([x, y], i) => {
        const ox = isScanning ? Math.sin(t * 0.002 + i * 0.4) * 0.015 : 0;
        const oy = isScanning ? Math.cos(t * 0.003 + i * 0.3) * 0.012 : 0;
        return [(x + ox) * w, (y + oy) * h];
      });

      if (isScanning) {
        const scanY = (scanProgress / 100) * h;
        const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
        grad.addColorStop(0, "rgba(0,255,180,0)");
        grad.addColorStop(0.5, `rgba(0,255,180,${0.15 + pulse * 0.1})`);
        grad.addColorStop(1, "rgba(0,255,180,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 40, w, 80);
        ctx.strokeStyle = `rgba(0,255,180,${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();
      }

      connections.forEach(([a, b]) => {
        ctx.strokeStyle = detectedSign
          ? `rgba(0,255,160,${0.6 + pulse * 0.3})`
          : `rgba(0,200,255,${0.35 + pulse * 0.2})`;
        ctx.lineWidth = detectedSign ? 2.5 : 1.8;
        ctx.beginPath();
        ctx.moveTo(animated[a][0], animated[a][1]);
        ctx.lineTo(animated[b][0], animated[b][1]);
        ctx.stroke();
      });

      animated.forEach(([x, y], i) => {
        const isJoint = [4,8,12,16,20].includes(i);
        ctx.beginPath();
        ctx.arc(x, y, isJoint ? 5 : 3.5, 0, Math.PI * 2);
        if (detectedSign) {
          ctx.fillStyle = `rgba(0,255,160,${0.8 + pulse * 0.2})`;
          ctx.shadowColor = "rgba(0,255,160,0.8)";
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = `rgba(0,210,255,${0.7 + pulse * 0.2})`;
          ctx.shadowColor = "rgba(0,210,255,0.5)";
          ctx.shadowBlur = 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isScanning, detectedSign, scanProgress]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={280}
      style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%", pointerEvents: "none",
      }}
    />
  );
};

// Signing avatar component
const SignAvatar = ({ word, isPlaying }) => {
  const [frame, setFrame] = useState(0);
  const frames = ["🤲", "🙌", "👐", "🤟", "✋"];

  useEffect(() => {
    if (!isPlaying) { setFrame(0); return; }
    const interval = setInterval(() => setFrame(f => (f + 1) % frames.length), 300);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div style={{
      fontSize: 64,
      textAlign: "center",
      filter: isPlaying ? "drop-shadow(0 0 20px rgba(0,255,160,0.6))" : "none",
      transition: "all 0.2s",
      transform: isPlaying ? `scale(1.1) rotate(${frame % 2 === 0 ? -5 : 5}deg)` : "scale(1)",
    }}>
      {isPlaying ? frames[frame] : (word ? SIGNS.find(s => s.word === word)?.emoji || "🤟" : "🤲")}
    </div>
  );
};

export default function SignBridge() {
  const [mode, setMode] = useState("home");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedSign, setDetectedSign] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [inputText, setInputText] = useState("");
  const [avatarWord, setAvatarWord] = useState(null);
  const [isAvatarPlaying, setIsAvatarPlaying] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [notification, setNotification] = useState(null);
  const scanRef = useRef(null);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const startScan = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    setDetectedSign(null);
    setScanProgress(0);
    setConfidence(0);
    let progress = 0;
    scanRef.current = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(scanRef.current);
        const sign = SIGNS[Math.floor(Math.random() * SIGNS.length)];
        const conf = Math.floor(Math.random() * 15 + 85);
        setDetectedSign(sign);
        setConfidence(conf);
        setIsScanning(false);
        setTranscript(prev => [...prev, {
          type: "sign", text: sign.word, emoji: sign.emoji,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        showNotif(`Detected: ${sign.word} (${conf}% confidence)`);
      }
    }, 30);
  }, [isScanning]);

  const stopScan = () => {
    clearInterval(scanRef.current);
    setIsScanning(false);
    setScanProgress(0);
  };

  const playSign = (word) => {
    setAvatarWord(word);
    setIsAvatarPlaying(true);
    setTimeout(() => setIsAvatarPlaying(false), 2000);
  };

  const handleTextToSign = () => {
    if (!inputText.trim()) return;
    const words = inputText.trim().toUpperCase().split(" ");
    setTranscript(prev => [...prev, {
      type: "speech", text: inputText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInputText("");
    let delay = 0;
    words.forEach(word => {
      const sign = SIGNS.find(s => s.word === word || s.word.includes(word));
      if (sign) {
        setTimeout(() => playSign(sign.word), delay);
        delay += 2200;
      }
    });
  };

  const simulateSpeech = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setInputText(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    }, 2000);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #050a0e; }
    .sb-root {
      font-family: 'Syne', sans-serif;
      background: #050a0e;
      color: #e8f4f8;
      min-height: 100vh;
      max-width: 430px;
      margin: 0 auto;
      position: relative;
      overflow-x: hidden;
    }
    .sb-bg {
      position: fixed; inset: 0;
      background:
        radial-gradient(ellipse 60% 40% at 20% 20%, rgba(0,180,255,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 50% 60% at 80% 80%, rgba(0,255,160,0.05) 0%, transparent 60%),
        #050a0e;
      pointer-events: none; z-index: 0;
    }
    .sb-content { position: relative; z-index: 1; }
    .sb-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 20px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .sb-logo { display: flex; align-items: center; gap: 10px; }
    .sb-logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #00b4ff, #00ffa0);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .sb-logo-text {
      font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
      background: linear-gradient(135deg, #00b4ff, #00ffa0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .sb-status {
      display: flex; align-items: center; gap: 6px;
      background: rgba(0,255,160,0.08);
      border: 1px solid rgba(0,255,160,0.2);
      border-radius: 20px; padding: 5px 12px;
      font-size: 11px; font-weight: 600; color: #00ffa0;
      font-family: 'Space Mono', monospace;
    }
    .sb-status-dot {
      width: 6px; height: 6px;
      background: #00ffa0; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .sb-camera {
      margin: 0 16px 16px;
      border-radius: 20px; overflow: hidden;
      background: #0a1520;
      border: 1px solid rgba(0,180,255,0.15);
      position: relative; height: 280px;
    }
    .sb-camera-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #0a1520 0%, #0d1f30 100%);
    }
    .sb-camera-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px);
      background-size: 30px 30px;
    }
    .sb-camera-corner {
      position: absolute; width: 20px; height: 20px;
      border-color: rgba(0,180,255,0.5); border-style: solid;
    }
    .sb-camera-corner.tl { top:16px; left:16px; border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
    .sb-camera-corner.tr { top:16px; right:16px; border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
    .sb-camera-corner.bl { bottom:16px; left:16px; border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
    .sb-camera-corner.br { bottom:16px; right:16px; border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }
    .sb-camera-label {
      position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
      font-family: 'Space Mono', monospace; font-size: 10px;
      color: rgba(0,180,255,0.6); letter-spacing: 2px;
    }
    .sb-camera-hint {
      position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
      font-size: 11px; color: rgba(255,255,255,0.3);
      white-space: nowrap; font-family: 'Space Mono', monospace;
    }
    .sb-person-silhouette {
      position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
      font-size: 90px; opacity: 0.06; pointer-events: none;
    }
    .sb-scan-progress {
      position: absolute; bottom: 0; left: 0; height: 3px;
      background: linear-gradient(90deg, #00b4ff, #00ffa0);
      transition: width 0.03s linear; border-radius: 0 2px 0 0;
    }
    .sb-detection {
      margin: 0 16px 12px; padding: 16px; border-radius: 16px;
      background: linear-gradient(135deg, rgba(0,255,160,0.08), rgba(0,180,255,0.05));
      border: 1px solid rgba(0,255,160,0.2);
      display: flex; align-items: center; gap: 16px;
      animation: fadeIn 0.4s ease;
    }
    .sb-detection-emoji { font-size: 36px; }
    .sb-detection-word { font-size: 24px; font-weight: 800; color: #00ffa0; }
    .sb-detection-desc { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .sb-confidence { margin-left: auto; text-align: right; }
    .sb-confidence-val { font-family: 'Space Mono', monospace; font-size: 22px; font-weight: 700; color: #00ffa0; }
    .sb-confidence-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; }
    .sb-scan-btn {
      display: block; width: calc(100% - 32px); margin: 0 16px 16px;
      padding: 16px; border-radius: 16px; border: none;
      cursor: pointer; font-family: 'Syne', sans-serif;
      font-size: 16px; font-weight: 700; letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .sb-scan-btn.idle { background: linear-gradient(135deg, #00b4ff, #00ffa0); color: #050a0e; }
    .sb-scan-btn.scanning {
      background: rgba(255,60,60,0.15);
      border: 1px solid rgba(255,60,60,0.4); color: #ff4040;
    }
    .sb-scan-btn:hover { transform: translateY(-1px); opacity: 0.9; }
    .sb-scan-btn:active { transform: translateY(0); }
    .sb-transcript { margin: 0 16px 16px; }
    .sb-transcript-title {
      font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3);
      text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;
      font-family: 'Space Mono', monospace;
    }
    .sb-transcript-list {
      display: flex; flex-direction: column; gap: 8px;
      max-height: 160px; overflow-y: auto;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .sb-msg {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 12px;
      animation: fadeIn 0.3s ease;
    }
    .sb-msg.sign { background: rgba(0,255,160,0.06); border: 1px solid rgba(0,255,160,0.12); }
    .sb-msg.speech { background: rgba(0,180,255,0.06); border: 1px solid rgba(0,180,255,0.12); }
    .sb-msg-icon { font-size: 18px; }
    .sb-msg-text { font-size: 14px; font-weight: 600; flex: 1; }
    .sb-msg-time { font-size: 10px; color: rgba(255,255,255,0.25); font-family: 'Space Mono', monospace; }
    .sb-t2s { margin: 0 16px; }
    .sb-avatar-box {
      background: #0a1520; border: 1px solid rgba(0,255,160,0.15);
      border-radius: 20px; padding: 30px 20px; text-align: center; margin-bottom: 16px;
    }
    .sb-avatar-name { font-size: 18px; font-weight: 700; color: #00ffa0; margin-top: 12px; }
    .sb-avatar-subtitle { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 4px; }
    .sb-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .sb-input {
      flex: 1; background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 12px 16px;
      color: #e8f4f8; font-family: 'Syne', sans-serif;
      font-size: 14px; outline: none;
    }
    .sb-input:focus { border-color: rgba(0,180,255,0.4); background: rgba(0,180,255,0.05); }
    .sb-input::placeholder { color: rgba(255,255,255,0.2); }
    .sb-btn-icon {
      width: 46px; height: 46px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; transition: all 0.2s; flex-shrink: 0;
    }
    .sb-btn-icon:hover { background: rgba(255,255,255,0.1); }
    .sb-btn-icon.mic { background: rgba(0,180,255,0.1); border-color: rgba(0,180,255,0.3); }
    .sb-send-btn {
      width: 46px; height: 46px; border-radius: 12px;
      background: linear-gradient(135deg, #00b4ff, #00ffa0);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; transition: all 0.2s; flex-shrink: 0;
    }
    .sb-send-btn:hover { transform: scale(1.05); }
    .sb-phrases { margin: 0 16px; }
    .sb-phrase-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 8px; cursor: pointer; transition: all 0.2s;
    }
    .sb-phrase-card:hover { background: rgba(0,180,255,0.06); border-color: rgba(0,180,255,0.2); }
    .sb-phrase-text { font-size: 14px; font-weight: 600; }
    .sb-phrase-play { font-size: 20px; }
    .sb-learn {
      margin: 0 16px;
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
    }
    .sb-learn-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px; padding: 14px 10px;
      text-align: center; cursor: pointer; transition: all 0.2s;
    }
    .sb-learn-card:hover { background: rgba(0,255,160,0.06); border-color: rgba(0,255,160,0.2); transform: translateY(-2px); }
    .sb-learn-emoji { font-size: 26px; }
    .sb-learn-word { font-size: 11px; font-weight: 700; margin-top: 6px; color: rgba(255,255,255,0.7); }
    .sb-home { padding: 20px 16px; }
    .sb-hero { text-align: center; margin-bottom: 32px; padding-top: 10px; }
    .sb-hero-icon { font-size: 70px; margin-bottom: 16px; }
    .sb-hero-title {
      font-size: 30px; font-weight: 800; line-height: 1.1; margin-bottom: 10px;
      background: linear-gradient(135deg, #ffffff, #00ffa0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .sb-hero-sub { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.6; }
    .sb-stats { display: flex; gap: 10px; margin-bottom: 28px; }
    .sb-stat {
      flex: 1; background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px; padding: 14px; text-align: center;
    }
    .sb-stat-val {
      font-size: 22px; font-weight: 800;
      background: linear-gradient(135deg, #00b4ff, #00ffa0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .sb-stat-label { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
    .sb-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .sb-mode-card { padding: 20px 16px; border-radius: 18px; cursor: pointer; transition: all 0.2s; border: 1px solid; }
    .sb-mode-card:hover { transform: translateY(-3px); }
    .sb-mode-card.cam { background: linear-gradient(135deg, rgba(0,180,255,0.12), rgba(0,255,160,0.06)); border-color: rgba(0,180,255,0.2); grid-column: span 2; }
    .sb-mode-card.txt { background: rgba(0,255,160,0.06); border-color: rgba(0,255,160,0.15); }
    .sb-mode-card.book { background: rgba(255,180,0,0.06); border-color: rgba(255,180,0,0.15); }
    .sb-mode-icon { font-size: 28px; margin-bottom: 10px; }
    .sb-mode-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .sb-mode-desc { font-size: 12px; color: rgba(255,255,255,0.4); }
    .sb-notif {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0,255,160,0.15); border: 1px solid rgba(0,255,160,0.4);
      border-radius: 20px; padding: 10px 20px;
      font-size: 13px; font-weight: 600; color: #00ffa0;
      z-index: 999; animation: slideDown 0.3s ease; white-space: nowrap;
    }
    .sb-back {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.4); font-family: 'Space Mono', monospace;
      font-size: 12px; padding: 16px 16px 8px;
      display: flex; align-items: center; gap: 6px; transition: color 0.2s;
    }
    .sb-back:hover { color: rgba(255,255,255,0.8); }
    .sb-section-title { font-size: 20px; font-weight: 800; padding: 0 16px 16px; }
  `;

  return (
    <div className="sb-root">
      <style>{css}</style>
      <div className="sb-bg" />
      {notification && <div className="sb-notif">✓ {notification}</div>}

      <div className="sb-content">
        {/* Header */}
        <div className="sb-header">
          <div className="sb-logo">
            <div className="sb-logo-icon">🤟</div>
            <div className="sb-logo-text">SignBridge</div>
          </div>
          <div className="sb-status">
            <div className="sb-status-dot" />
            ON-DEVICE AI
          </div>
        </div>

        {/* HOME */}
        {mode === "home" && (
          <div className="sb-home">
            <div className="sb-hero">
              <div className="sb-hero-icon">🤟</div>
              <div className="sb-hero-title">Break the silence.<br />Bridge every word.</div>
              <div className="sb-hero-sub">Real-time sign language interpreter.<br />No internet. No compromise. 100% private.</div>
            </div>
            <div className="sb-stats">
              <div className="sb-stat"><div className="sb-stat-val">50+</div><div className="sb-stat-label">Signs</div></div>
              <div className="sb-stat"><div className="sb-stat-val">2-way</div><div className="sb-stat-label">Mode</div></div>
              <div className="sb-stat"><div className="sb-stat-val">0ms</div><div className="sb-stat-label">Upload</div></div>
            </div>
            <div className="sb-mode-grid">
              <div className="sb-mode-card cam" onClick={() => setMode("sign2text")}>
                <div className="sb-mode-icon">📷</div>
                <div className="sb-mode-title">Sign → Text</div>
                <div className="sb-mode-desc">Point camera at signing hands — AI detects and reads aloud for hearing people</div>
              </div>
              <div className="sb-mode-card txt" onClick={() => setMode("text2sign")}>
                <div className="sb-mode-icon">💬</div>
                <div className="sb-mode-title">Speech → Sign</div>
                <div className="sb-mode-desc">Speak or type — avatar performs signs</div>
              </div>
              <div className="sb-mode-card book" onClick={() => setMode("phrasebook")}>
                <div className="sb-mode-icon">📖</div>
                <div className="sb-mode-title">Phrasebook</div>
                <div className="sb-mode-desc">Common phrases instantly</div>
              </div>
            </div>
            <div style={{ padding: "20px 0 8px", textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'Space Mono', monospace" }}>tap any card to start</span>
            </div>
          </div>
        )}

        {/* SIGN → TEXT */}
        {mode === "sign2text" && (
          <>
            <button className="sb-back" onClick={() => { setMode("home"); setDetectedSign(null); stopScan(); }}>← back</button>
            <div className="sb-section-title">Sign → Text</div>
            <div className="sb-camera">
              <div className="sb-camera-bg" />
              <div className="sb-camera-grid" />
              <div className="sb-person-silhouette">🧑</div>
              <div className="sb-camera-corner tl" /><div className="sb-camera-corner tr" />
              <div className="sb-camera-corner bl" /><div className="sb-camera-corner br" />
              <div className="sb-camera-label">LIVE FEED</div>
              <HandCanvas isScanning={isScanning} detectedSign={detectedSign} scanProgress={scanProgress} />
              <div className="sb-camera-hint">
                {isScanning ? "Analyzing gesture..." : detectedSign ? `"${detectedSign.word}" detected` : "Position hands in frame"}
              </div>
              {isScanning && <div className="sb-scan-progress" style={{ width: `${scanProgress}%` }} />}
            </div>
            {detectedSign && (
              <div className="sb-detection">
                <div className="sb-detection-emoji">{detectedSign.emoji}</div>
                <div>
                  <div className="sb-detection-word">{detectedSign.word}</div>
                  <div className="sb-detection-desc">{detectedSign.description}</div>
                </div>
                <div className="sb-confidence">
                  <div className="sb-confidence-val">{confidence}%</div>
                  <div className="sb-confidence-label">Confidence</div>
                </div>
              </div>
            )}
            <button className={`sb-scan-btn ${isScanning ? "scanning" : "idle"}`} onClick={isScanning ? stopScan : startScan}>
              {isScanning ? "⏹ Stop Scanning" : "▶ Start Recognition"}
            </button>
            {transcript.length > 0 && (
              <div className="sb-transcript">
                <div className="sb-transcript-title">Session Transcript</div>
                <div className="sb-transcript-list">
                  {transcript.map((msg, i) => (
                    <div key={i} className={`sb-msg ${msg.type}`}>
                      <span className="sb-msg-icon">{msg.type === "sign" ? msg.emoji : "🗣️"}</span>
                      <span className="sb-msg-text">{msg.text}</span>
                      <span className="sb-msg-time">{msg.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* TEXT → SIGN */}
        {mode === "text2sign" && (
          <>
            <button className="sb-back" onClick={() => setMode("home")}>← back</button>
            <div className="sb-section-title">Speech → Sign</div>
            <div className="sb-t2s">
              <div className="sb-avatar-box">
                <SignAvatar word={avatarWord} isPlaying={isAvatarPlaying} />
                <div className="sb-avatar-name">{isAvatarPlaying ? avatarWord || "Signing..." : avatarWord ? avatarWord : "Ready"}</div>
                <div className="sb-avatar-subtitle">{isAvatarPlaying ? "Performing sign..." : "Type or speak to see signs"}</div>
              </div>
              <div className="sb-input-row">
                <input
                  className="sb-input"
                  placeholder="Type a word or phrase..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleTextToSign()}
                />
                <button className="sb-btn-icon mic" onClick={simulateSpeech} title="Speak">
                  {isListening ? "🔴" : "🎙️"}
                </button>
                <button className="sb-send-btn" onClick={handleTextToSign} title="Sign it">▶</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {["HELLO", "THANK YOU", "HELP", "YES", "NO"].map(w => (
                  <button key={w} onClick={() => setInputText(w)} style={{
                    padding: "6px 14px", borderRadius: 20,
                    border: "1px solid rgba(0,255,160,0.2)",
                    background: "rgba(0,255,160,0.06)", color: "#00ffa0",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Syne', sans-serif",
                  }}>{w}</button>
                ))}
              </div>
              {transcript.length > 0 && (
                <div className="sb-transcript">
                  <div className="sb-transcript-title">History</div>
                  <div className="sb-transcript-list">
                    {transcript.map((msg, i) => (
                      <div key={i} className={`sb-msg ${msg.type}`}>
                        <span className="sb-msg-icon">{msg.type === "sign" ? msg.emoji : "💬"}</span>
                        <span className="sb-msg-text">{msg.text}</span>
                        <span className="sb-msg-time">{msg.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* PHRASEBOOK */}
        {mode === "phrasebook" && (
          <>
            <button className="sb-back" onClick={() => setMode("home")}>← back</button>
            <div className="sb-section-title">Phrasebook</div>
            <div className="sb-phrases">
              {PHRASES.map((p, i) => (
                <div key={i} className="sb-phrase-card"
                  onClick={() => { setMode("text2sign"); setInputText(p); showNotif("Phrase loaded"); }}>
                  <div className="sb-phrase-text">{p}</div>
                  <div className="sb-phrase-play">▶</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 0 8px" }}>
              <div className="sb-transcript-title" style={{ padding: "0 16px", marginBottom: 10 }}>Common Signs</div>
              <div className="sb-learn">
                {SIGNS.slice(0, 9).map((s, i) => (
                  <div key={i} className="sb-learn-card"
                    onClick={() => { setMode("text2sign"); playSign(s.word); showNotif(`Playing: ${s.word}`); }}>
                    <div className="sb-learn-emoji">{s.emoji}</div>
                    <div className="sb-learn-word">{s.word}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
