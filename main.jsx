import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Target, FileText, Activity, Trash2, Award, Plus, Sparkles, RefreshCw, 
  Upload, Cpu, BarChart2, CheckCircle2, AlertTriangle, Edit3, Save, Settings, RotateCcw
} from 'lucide-react';

const PAIR_OPTIONS = [
  'EUR/USD', 'USD/CHF', 'NZD/USD', 'XAU/USD', 'USD/JPY',
  'EUR/GBP', 'GBP/USD', 'USD/CAD', 'EUR/CHF', 'EUR/JPY', 'AUD/USD', 'CUSTOM'
];

// DEFAULT WEIGHTS CONFIGURATION
const DEFAULT_WEIGHTS = {
  htfTrend: 10,
  mtfTrend: 10,
  ltfTrend: 5,
  zoneStandard: 10,
  zoneExtreme: 20,
  hasImbalance: 25,
  liqPush: 10,
  liqPull: 5,
  liqBoth: 15,
  vShapeLiq: 10,
  shiftMs: 10,
  shiftFractal: 5,
  trapWeight: 5,
  selectedModel: 15
};

function App() {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'journal', 'analytics', 'settings'
  
  // TRADES STATE
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('scalp_journal_trades');
    return saved ? JSON.parse(saved) : [];
  });

  // WEIGHTS CONFIGURATION STATE
  const [weights, setWeights] = useState(() => {
    const saved = localStorage.getItem('scalp_journal_weights');
    return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
  });

  // EDITING STATE
  const [editingTradeId, setEditingTradeId] = useState(null);

  // FORM & TRADE STAGING STATE
  const [pair, setPair] = useState('EUR/USD');
  const [customPair, setCustomPair] = useState('');
  const [tradeType, setTradeType] = useState('LONG');
  const [tradeStatus, setTradeStatus] = useState('ACTIVE'); // 'PENDING', 'ACTIVE', 'CLOSED'
  const [session, setSession] = useState('London Session');
  const [accountSize] = useState('10900');
  const [riskAmount, setRiskAmount] = useState('109');
  const [tradeResult, setTradeResult] = useState('WIN');
  const [pnlAmount, setPnlAmount] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');

  // 01: BIAS & TRENDS
  const [htfTrend, setHtfTrend] = useState(false);
  const [mtfTrend, setMtfTrend] = useState(false);
  const [ltfTrend, setLtfTrend] = useState(false);

  // 02: KEY ZONES & IMBALANCE
  const [zoneType, setZoneType] = useState('none'); 
  const [hasImbalance, setHasImbalance] = useState(false);

  // 03: LIQUIDITY SWEEPS
  const [liquidityType, setLiquidityType] = useState('none');
  const [vShapeLiq, setVShapeLiq] = useState(false);

  // 04: MARKET SHIFT, TRAPS & MODELS
  const [shiftType, setShiftType] = useState('none');
  const [trapsCount, setTrapsCount] = useState(0);
  const [selectedModel, setSelectedModel] = useState('none');

  // SCREENSHOTS & AI STATE
  const [images, setImages] = useState({ htf: null, mtf: null, ltf: null, entry: null, model: null });
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  useEffect(() => {
    localStorage.setItem('scalp_journal_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('scalp_journal_weights', JSON.stringify(weights));
  }, [weights]);

  // Dynamic Account Balance starting from $10,900
  const currentAccountBalance = useMemo(() => {
    const closedPnL = trades
      .filter(t => t.status === 'CLOSED')
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    return (parseFloat(accountSize) || 10900) + closedPnL;
  }, [trades, accountSize]);

  // DYNAMIC CONFLUENCE SCORE CALCULATION
  const calculatedScore = useMemo(() => {
    let score = 0;
    if (htfTrend) score += (weights.htfTrend || 0);
    if (mtfTrend) score += (weights.mtfTrend || 0);
    if (ltfTrend) score += (weights.ltfTrend || 0);
    if (zoneType === 'standard') score += (weights.zoneStandard || 0);
    if (zoneType === 'extreme') score += (weights.zoneExtreme || 0);
    if (hasImbalance) score += (weights.hasImbalance || 0);
    if (liquidityType === 'push') score += (weights.liqPush || 0);
    if (liquidityType === 'pull') score += (weights.liqPull || 0);
    if (liquidityType === 'both') score += (weights.liqBoth || 0);
    if (vShapeLiq) score += (weights.vShapeLiq || 0);
    if (shiftType === 'ms') score += (weights.shiftMs || 0);
    if (shiftType === 'fractal') score += (weights.shiftFractal || 0);
    score += (trapsCount * (weights.trapWeight || 0));
    if (selectedModel !== 'none') score += (weights.selectedModel || 0);
    return Math.min(score, 100);
  }, [htfTrend, mtfTrend, ltfTrend, zoneType, hasImbalance, liquidityType, vShapeLiq, shiftType, trapsCount, selectedModel, weights]);

  // EXACT GRADES BASED ON DYNAMIC SCORE: C (<50), B (50-59), B+ (60-74), A (75-84), A+ (85+)
  const setupGrade = useMemo(() => {
    if (calculatedScore >= 85) return { grade: 'A+', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500', desc: 'Setup עילאי - כניסה מומלצת בביטחון מלא' };
    if (calculatedScore >= 75) return { grade: 'A', color: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500', desc: 'Setup איכותי - עומד בכללי האסטרטגיה' };
    if (calculatedScore >= 60) return { grade: 'B+', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500', desc: 'Setup בינוני-גבוה - מומלץ לחכות לאישור LTF' };
    if (calculatedScore >= 50) return { grade: 'B', color: 'text-orange-400', badge: 'bg-orange-500/20 border-orange-500', desc: 'גבולי - סיכון מוגבר' };
    return { grade: 'C', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500', desc: 'סיכון גבוה - להימנע מביצוע העסקה' };
  }, [calculatedScore]);

  const handleImageUpload = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => ({ ...prev, [key]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleWeightChange = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: Number(val) || 0 }));
  };

  const resetWeightsToDefault = () => {
    if (confirm('האם להחזיר את המשקלים להגדרות ברירת המחדל?')) {
      setWeights(DEFAULT_WEIGHTS);
    }
  };

  // AI ANALYSIS FUNCTION
  const runAiAnalysis = async () => {
    setAiAnalyzing(true);
    setAiFeedback(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      const promptText = `אתה אנליסט מומחה למסחר לפי שיטת 1% Percent Club (Brad) ו-SMC/ICT.
בצע ניתוח מקיף לניתוח לפני כניסה לעסקה (Pre-Trade Staging):

פרטי ה-Setup:
- צמד: ${pair === 'CUSTOM' ? customPair : pair} | כיוון: ${tradeType} | סשן: ${session}
- ציון Confluence: ${calculatedScore}% | דירוג עסקה מחושב: ${setupGrade.grade}
- מגמות: HTF 1H=${htfTrend ? 'כן' : 'לא'}, MTF 15m=${mtfTrend ? 'כן' : 'לא'}, LTF 1m=${ltfTrend ? 'כן' : 'לא'}
- אזור: ${zoneType}, Imbalance (FVG): ${hasImbalance ? 'כן' : 'לא'}
- נזילות: ${liquidityType}, V-Shape: ${vShapeLiq ? 'כן' : 'לא'}
- שיפט: ${shiftType}, מלכודות: ${trapsCount}, מודל כניסה: ${selectedModel}
- יתרת חשבון: $${currentAccountBalance}, סיכון 1%: $${riskAmount}
- הערות ודגשים מהסוחר: "${tradeNotes || 'אין הערות נוספות'}"

הנחיות לתשובה בעברית:
1. **דירוג והערכת Setup:** האם הדירוג (${setupGrade.grade}) מוצדק והאם הניתוח בוצע נכון?
2. **ניתוח תמונות והקשר:** האם מבנה השוק והכניסה תואמים את המודל הנבחר?
3. **המלצה סופית וחד-משמעית:** רשום במפורש: [כניסה מומלצת / להמתין לאישור נוסף / להימנע מביצוע].
4. **ניהול סיכונים:** וודא יעד רווח מינימלי של 3R ($${(parseFloat(riskAmount) * 3).toFixed(0)}).`;

      if (apiKey) {
        const activeImageParts = [];
        ['htf', 'mtf', 'ltf', 'entry', 'model'].forEach((key) => {
          if (images[key] && images[key].startsWith('data:image')) {
            const base64Data = images[key].split(',')[1];
            const mimeType = images[key].split(';')[0].split(':')[1];
            activeImageParts.push({ inlineData: { mimeType, data: base64Data } });
          }
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }, ...activeImageParts] }] })
        });

        const result = await response.json();
        const answer = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) {
          setAiFeedback({ summary: answer, grade: setupGrade.grade, status: 'success' });
          setAiAnalyzing(false);
          return;
        }
      }

      // Fallback local analysis
      setTimeout(() => {
        setAiFeedback({
          summary: `📊 **דירוג עסקה:** ${setupGrade.grade} (ציון ${calculatedScore}%)
• **הערכת ניתוח:** ${calculatedScore >= 75 ? 'ה-Setup מתוכנן היטב לפי כללי ה-1% Percent Club.' : 'ה-Setup כולל חסרים במרכיבי Confluence מרכזיים.'}
• **סנכרון מגמות:** ${htfTrend && mtfTrend ? 'סנכרון מלא בין 1H ל-15m.' : 'חסר סנכרון מגמה מלא.'}
• **שתיית נזילות:** ${liquidityType !== 'none' ? 'זוהה אינדוסמנט בשוק.' : 'לא סומנה שתיית נזילות ברורה.'}
• **המלצה סופית:** ${calculatedScore >= 75 ? '🟢 **כניסה מומלצת** (וודא Stop Loss מוגדר ויעד 3R)' : calculatedScore >= 60 ? '🟡 **להמתין לאישור נוסף ב-1m**' : '🔴 **להימנע מביצוע העסקה**'}
• **יעד רווח 3R מומלץ:** $${(parseFloat(riskAmount) * 3).toFixed(0)}`,
          grade: setupGrade.grade,
          status: 'local'
        });
        setAiAnalyzing(false);
      }, 800);

    } catch (err) {
      setAiAnalyzing(false);
    }
  };

  // SAVE OR UPDATE TRADE
  const handleSaveTrade = () => {
    const finalPair = pair === 'CUSTOM' ? customPair.toUpperCase() : pair;
    if (!finalPair) return alert('נא להזין צמד מטבעות');

    const risk = parseFloat(riskAmount) || (currentAccountBalance * 0.01);
    let pnl = 0;
    let rMult = '0.0';

    if (tradeStatus === 'CLOSED') {
      pnl = parseFloat(pnlAmount) || (tradeResult === 'WIN' ? risk * 3 : tradeResult === 'LOSS' ? -risk : 0);
      rMult = (pnl / risk).toFixed(1);
    }

    const tradeData = {
      id: editingTradeId || `tr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      pair: finalPair,
      type: tradeType,
      session,
      status: tradeStatus,
      riskAmount: risk.toString(),
      result: tradeStatus === 'CLOSED' ? tradeResult : 'PENDING',
      pnl: pnl.toString(),
      rMultiple: rMult,
      score: calculatedScore,
      grade: setupGrade.grade,
      model: selectedModel,
      notes: tradeNotes,
      screenshots: { ...images }
    };

    if (editingTradeId) {
      setTrades(trades.map(t => t.id === editingTradeId ? tradeData : t));
      alert('העסקה עודכנה בהצלחה!');
      setEditingTradeId(null);
    } else {
      setTrades([tradeData, ...trades]);
      alert('העסקה נשמרה ביומן בהצלחה!');
    }

    // Reset Form
    setTradeNotes('');
    setPnlAmount('');
    setImages({ htf: null, mtf: null, ltf: null, entry: null, model: null });
  };

  // LOAD TRADE TO EDIT
  const handleEditTrade = (trade) => {
    setEditingTradeId(trade.id);
    setPair(PAIR_OPTIONS.includes(trade.pair) ? trade.pair : 'CUSTOM');
    if (!PAIR_OPTIONS.includes(trade.pair)) setCustomPair(trade.pair);
    setTradeType(trade.type);
    setTradeStatus(trade.status);
    setSession(trade.session);
    setRiskAmount(trade.riskAmount);
    setTradeResult(trade.result === 'PENDING' ? 'WIN' : trade.result);
    setPnlAmount(trade.pnl);
    setTradeNotes(trade.notes || '');
    if (trade.screenshots) setImages(trade.screenshots);
    setActiveTab('calculator');
  };

  const handleDeleteTrade = (id) => {
    if (confirm('האם למחוק עסקה זו מהיומן?')) {
      setTrades(trades.filter(t => t.id !== id));
    }
  };

  const analytics = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED');
    const total = closed.length;
    if (total === 0) return { total: 0, winRate: 0, totalPnl: 0, avgR: 0 };
    const wins = closed.filter(t => t.result === 'WIN').length;
    const winRate = ((wins / total) * 100).toFixed(1);
    const totalPnl = closed.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
    const totalR = closed.reduce((acc, t) => acc + (parseFloat(t.rMultiple) || 0), 0);
    return { total, wins, winRate, totalPnl, avgR:
