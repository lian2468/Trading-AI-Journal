import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Target, FileText, Activity, Trash2, Plus, Sparkles, RefreshCw, 
  Upload, Cpu, BarChart2, CheckCircle2
} from 'lucide-react';

const PAIR_OPTIONS = [
  'EUR/USD', 'USD/CHF', 'NZD/USD', 'XAU/USD', 'USD/JPY',
  'EUR/GBP', 'GBP/USD', 'USD/CAD', 'EUR/CHF', 'EUR/JPY', 'AUD/USD', 'CUSTOM'
];

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('scalp_journal_trades');
    return saved ? JSON.parse(saved) : [];
  });

  // FORM & STAGING STATE
  const [pair, setPair] = useState('EUR/USD');
  const [customPair, setCustomPair] = useState('');
  const [tradeType, setTradeType] = useState('LONG');
  const [tradeStatus, setTradeStatus] = useState('ACTIVE');
  const [session, setSession] = useState('London Session');
  const [accountSize] = useState('10900');
  const [riskAmount, setRiskAmount] = useState('109');
  const [tradeResult, setTradeResult] = useState('WIN');
  const [pnlAmount, setPnlAmount] = useState('');
  const [notes, setNotes] = useState('');

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

  // SCREENSHOTS
  const [images, setImages] = useState({ htf: null, mtf: null, ltf: null, entry: null, model: null });
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  useEffect(() => {
    localStorage.setItem('scalp_journal_trades', JSON.stringify(trades));
  }, [trades]);

  const currentAccountBalance = useMemo(() => {
    const closedPnL = trades
      .filter(t => t.status === 'CLOSED')
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    return (parseFloat(accountSize) || 10900) + closedPnL;
  }, [trades, accountSize]);

  const calculatedScore = useMemo(() => {
    let score = 0;
    if (htfTrend) score += 10;
    if (mtfTrend) score += 10;
    if (ltfTrend) score += 5;
    if (zoneType === 'standard') score += 10;
    if (zoneType === 'extreme') score += 20;
    if (hasImbalance) score += 25;
    if (liquidityType === 'push') score += 10;
    if (liquidityType === 'pull') score += 5;
    if (liquidityType === 'both') score += 15;
    if (vShapeLiq) score += 10;
    if (shiftType === 'ms') score += 10;
    if (shiftType === 'fractal') score += 5;
    score += (trapsCount * 5);
    if (selectedModel !== 'none') score += 15;
    return Math.min(score, 100);
  }, [htfTrend, mtfTrend, ltfTrend, zoneType, hasImbalance, liquidityType, vShapeLiq, shiftType, trapsCount, selectedModel]);

  const handleImageUpload = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => ({ ...prev, [key]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const runAiAnalysis = async () => {
    setAiAnalyzing(true);
    setAiFeedback(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('NO_KEY');

      const activeImageParts = [];
      ['htf', 'mtf', 'ltf', 'entry', 'model'].forEach((key) => {
        if (images[key] && images[key].startsWith('data:image')) {
          const base64Data = images[key].split(',')[1];
          const mimeType = images[key].split(';')[0].split(':')[1];
          activeImageParts.push({ inlineData: { mimeType, data: base64Data } });
        }
      });

      const promptText = `ניתוח תכנון עסקה (1% Percent Club - Brad):
- צמד: ${pair === 'CUSTOM' ? customPair : pair} | כיוון: ${tradeType} | סשן: ${session}
- ציון Confluence: ${calculatedScore}%
- מגמות: HTF 1H=${htfTrend}, MTF 15m=${mtfTrend}, LTF 1m=${ltfTrend}
- אזור: ${zoneType}, Imbalance: ${hasImbalance}
- נזילות: ${liquidityType}, V-Shape: ${vShapeLiq}
- שיפט: ${shiftType}, מלכודות: ${trapsCount}, מודל: ${selectedModel}
- יתרת חשבון: $${currentAccountBalance}, סיכון 1%: $${riskAmount}

תן חוות דעת קצרה וממוקדת בעברית.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }, ...activeImageParts] }] })
      });

      const result = await response.json();
      const answer = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (answer) {
        setAiFeedback({ summary: answer, confidence: calculatedScore >= 75 ? 'גבוהה (Vision Verified)' : 'בינונית' });
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      setAiFeedback({
        summary: `ניתוח Setup מקומי: ציון ${calculatedScore}%.
• סנכרון מגמות: ${htfTrend && mtfTrend ? 'תקין' : 'חלקי'}.
• שתיית נזילות: ${liquidityType !== 'none' ? 'מזוהה' : 'טרם סומנה'}.
• יעד רווח מומלץ: לפחות 3R ($${(parseFloat(riskAmount) * 3).toFixed(0)}).`,
        confidence: 'סטנדרטי'
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

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

    const newTrade = {
      id: `tr-${Date.now()}`,
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
      model: selectedModel,
      notes,
      screenshots: { ...images }
    };

    setTrades([newTrade, ...trades]);
    alert('העסקה נשמרה ביומן בהצלחה!');
    setNotes('');
    setPnlAmount('');
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
    return { total, wins, winRate, totalPnl, avgR: (totalR / total).toFixed(1) };
  }, [trades]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans p-4 lg:p-8 pb-12">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-8 bg-[#121724] p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ScalpConfluence AI & Cloud Journal</h1>
            <p className="text-xs text-slate-400">1% Percent Club Strategy (Brad) • Min 3R Target</p>
          </div>
        </div>

        <div className="flex gap-4 items-center bg-[#182032] px-4 py-2 rounded-xl border border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 block">יתרת חשבון ($10,900)</span>
            <span className="text-lg font-bold font-mono text-emerald-400">${currentAccountBalance.toLocaleString()}</span>
          </div>
          <div className="border-r border-slate-700 pr-4">
            <span className="text-[10px] text-slate-400 block">סיכון (1%)</span>
            <span className="text-lg font-bold font-mono text-cyan-400">${(currentAccountBalance * 0.01).toFixed(0)}</span>
          </div>
        </div>

        <div className="flex gap-1 bg-[#0a0d14] p-1 rounded-xl border border-slate-800 text-xs">
          <button onClick={() => setActiveTab('calculator')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${activeTab === 'calculator' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
            <Target className="w-4 h-4" />
            <span>מחשבון & תכנון</span>
          </button>
          <button onClick={() => setActiveTab('journal')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${activeTab === 'journal' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
            <FileText className="w-4 h-4" />
            <span>יומן ({trades.length})</span>
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${activeTab === 'analytics' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
            <BarChart2 className="w-4 h-4" />
            <span>אנליטיקה</span>
          </button>
        </div>
      </header>

      {/* CALCULATOR TAB */}
      {activeTab === 'calculator' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            
            {/* 01: TRENDS */}
            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex justify-between">
                <span>01. סנכרון מגמות + צילומי מסך</span>
                <span className="text-xs text-cyan-400 font-mono">25%</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border space-y-2 ${htfTrend ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-[#182032] border-slate-800'}`}>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" checked={htfTrend} onChange={(e) => setHtfTrend(e.target.checked)} className="accent-cyan-500" />
                    <span>HTF שעתי (1H) +10%</span>
                  </label>
                  <div className="relative aspect-video bg-[#0d1117] rounded-lg border border-dashed border-slate-700 flex items-center justify-center">
                    {images.htf ? <img src={images.htf} className="w-full h-full object-cover rounded-lg" /> : <Upload className="w-4 h-4 text-slate-500" />}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('htf', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <div className={`p-3 rounded-xl border space-y-2 ${mtfTrend ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-[#182032] border-slate-800'}`}>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" checked={mtfTrend} onChange={(e) => setMtfTrend(e.target.checked)} className="accent-cyan-500" />
                    <span>MTF 15 דקות +10%</span>
                  </label>
                  <div className="relative aspect-video bg-[#0d1117] rounded-lg border border-dashed border-slate-700 flex items-center justify-center">
                    {images.mtf ? <img src={images.mtf} className="w-full h-full object-cover rounded-lg" /> : <Upload className="w-4 h-4 text-slate-500" />}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('mtf', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <div className={`p-3 rounded-xl border space-y-2 ${ltfTrend ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-[#182032] border-slate-800'}`}>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" checked={ltfTrend} onChange={(e) => setLtfTrend(e.target.checked)} className="accent-cyan-500" />
                    <span>LTF 1 דקה +5%</span>
                  </label>
                  <div className="relative aspect-video bg-[#0d1117] rounded-lg border border-dashed border-slate-700 flex items-center justify-center">
                    {images.ltf ? <img src={images.ltf} className="w-full h-full object-cover rounded-lg" /> : <Upload className="w-4 h-4 text-slate-500" />}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('ltf', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 02: KEY ZONES */}
            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex justify-between">
                <span>02. אזורי מפתח ואימבאלנס (FVG)</span>
                <span className="text-xs text-emerald-400 font-mono">45%</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-2">סוג האזור:</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setZoneType('none')} className={`w-full p-2.5 rounded-xl border text-right ${zoneType === 'none' ? 'bg-slate-800 border-slate-600' : 'bg-[#182032] border-slate-800'}`}>ללא אזור מיועד (0%)</button>
                    <button onClick={() => setZoneType('standard')} className={`w-full p-2.5 rounded-xl border text-right ${zoneType === 'standard' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-[#182032] border-slate-800'}`}>Demand / Supply Zone (+10%)</button>
                    <button onClick={() => setZoneType('extreme')} className={`w-full p-2.5 rounded-xl border text-right ${zoneType === 'extreme' ? 'bg-emerald-500/30 border-emerald-400 font-bold' : 'bg-[#182032] border-slate-800'}`}>Extreme Zone בקצה המבנה (+20%)</button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">FVG / Imbalance:</label>
                  <label onClick={() => setHasImbalance(!hasImbalance)} className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 ${hasImbalance ? 'bg-emerald-500/20 border-emerald-500' : 'bg-[#182032] border-slate-800'}`}>
                    <input type="checkbox" checked={hasImbalance} onChange={() => {}} className="accent-emerald-500" />
                    <div>
                      <span className="font-bold block">Imbalance / FVG קיים</span>
                      <span className="text-[10px] text-slate-400 block">+25% משקל הסתברות</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 03: LIQUIDITY SWEEPS */}
            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex justify-between">
                <span>03. שתיית נזילות (Liquidity Sweeps)</span>
                <span className="text-xs text-amber-400 font-mono">עד 25%</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-2">סוג אינדוסמנט:</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setLiquidityType('none')} className={`w-full p-2 rounded-lg border text-right ${liquidityType === 'none' ? 'bg-slate-800 border-slate-600' : 'bg-[#182032] border-slate-800'}`}>ללא אינדוסמנט (0%)</button>
                    <button onClick={() => setLiquidityType('push')} className={`w-full p-2 rounded-lg border text-right ${liquidityType === 'push' ? 'bg-amber-500/20 border-amber-500' : 'bg-[#182032] border-slate-800'}`}>Push Inducement (+10%)</button>
                    <button onClick={() => setLiquidityType('pull')} className={`w-full p-2 rounded-lg border text-right ${liquidityType === 'pull' ? 'bg-amber-500/20 border-amber-500' : 'bg-[#182032] border-slate-800'}`}>Pull Inducement (+5%)</button>
                    <button onClick={() => setLiquidityType('both')} className={`w-full p-2 rounded-lg border text-right font-bold ${liquidityType === 'both' ? 'bg-amber-500/30 border-amber-400' : 'bg-[#182032] border-slate-800'}`}>שילוב Push & Pull (+15%)</button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-2">V-Shape Liquidity:</label>
                  <label onClick={() => setVShapeLiq(!vShapeLiq)} className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 ${vShapeLiq ? 'bg-amber-500/20 border-amber-500' : 'bg-[#182032] border-slate-800'}`}>
                    <input type="checkbox" checked={vShapeLiq} onChange={() => {}} className="accent-amber-500" />
                    <div>
                      <span className="font-bold block text-amber-200">נזילות V-Shape</span>
                      <span className="text-[10px] text-slate-400 block">דחייה מהירה (+10%)</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 04: MARKET SHIFT */}
            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex justify-between">
                <span>04. שינוי מבנה (Shift) + מודלים</span>
                <span className="text-xs text-purple-400 font-mono">עד 30%</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-2">מרקט שיפט:</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setShiftType('none')} className={`w-full p-2 rounded-lg border text-right ${shiftType === 'none' ? 'bg-slate-800 border-slate-600' : 'bg-[#182032] border-slate-800'}`}>ללא Shift (0%)</button>
                    <button onClick={() => setShiftType('ms')} className={`w-full p-2 rounded-lg border text-right ${shiftType === 'ms' ? 'bg-purple-500/20 border-purple-500' : 'bg-[#182032] border-slate-800'}`}>Market Shift תקני (+10%)</button>
                    <button onClick={() => setShiftType('fractal')} className={`w-full p-2 rounded-lg border text-right ${shiftType === 'fractal' ? 'bg-purple-500/20 border-purple-500' : 'bg-[#182032] border-slate-800'}`}>Fractal MS (+5%)</button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-2">מודל כניסה (+15%):</label>
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full bg-[#182032] border border-slate-700 rounded-xl p-2.5 text-xs text-purple-200 mb-3">
                    <option value="none">ללא מודל ספציפי (0%)</option>
                    <option value="model3">מודל 3 - Fake Market Shift (+15%)</option>
                    <option value="model4">מודל 4 - Equal Highs / Lows (+15%)</option>
                    <option value="model5">מודל 5 - Fake Flip (+15%)</option>
                  </select>

                  <label className="text-slate-400 block mb-1">מלכודות MS (+5% לכל מלכודת):</label>
                  <div className="grid grid-cols-4 gap-1 bg-[#182032] p-1 rounded-xl border border-slate-700 text-center">
                    {[0, 1, 2, 3].map((num) => (
                      <button key={num} onClick={() => setTrapsCount(num)} className={`py-1 rounded-lg font-bold ${trapsCount === num ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>{num}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">צילום מודל כניסה:</label>
                  <div className="relative aspect-video bg-[#0d1117] rounded-xl border border-dashed border-purple-500/40 flex items-center justify-center">
                    {images.model ? <img src={images.model} className="w-full h-full object-cover rounded-xl" /> : <Upload className="w-4 h-4 text-purple-400" />}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('model', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#121724] p-6 rounded-2xl border border-slate-800 text-center space-y-4">
              <span className="text-xs text-slate-400 block">ציון Confluence</span>
              <span className="text-6xl font-black font-mono text-cyan-400">{calculatedScore}%</span>
              <button onClick={runAiAnalysis} disabled={aiAnalyzing} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                {aiAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>ניתוח תכנון ב-Gemini AI</span>
              </button>
            </div>

            {aiFeedback && (
              <div className="bg-[#121724] p-4 rounded-2xl border border-purple-500/40 space-y-2">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1"><Cpu className="w-4 h-4" /> חוות דעת Gemini AI</span>
                <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg whitespace-pre-line">{aiFeedback.summary}</p>
              </div>
            )}

            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2">פרטי העסקה והזנה</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">צמד</label>
                  <select value={pair} onChange={(e) => setPair(e.target.value)} className="w-full bg-[#182032] border border-slate-700 rounded-xl p-2 text-white">
                    {PAIR_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">סשן</label>
                  <select value={session} onChange={(e) => setSession(e.target.value)} className="w-full bg-[#182032] border border-slate-700 rounded-xl p-2 text-white">
                    <option value="London Session">London Session</option>
                    <option value="New York Session">New York Session</option>
                    <option value="Asia Session">Asia Session</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">כיוון</label>
                  <div className="grid grid-cols-2 gap-1 bg-[#182032] p-1 rounded-xl border border-slate-700">
                    <button onClick={() => setTradeType('LONG')} className={`py-1 font-bold rounded-lg ${tradeType === 'LONG' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>LONG</button>
                    <button onClick={() => setTradeType('SHORT')} className={`py-1 font-bold rounded-lg ${tradeType === 'SHORT' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>SHORT</button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">סיכון ($)</label>
                  <input type="number" value={riskAmount} onChange={(e) => setRiskAmount(e.target.value)} className="w-full bg-[#182032] border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
              </div>

              <button onClick={handleSaveTrade} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>שמור עסקה ביומן</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOURNAL TAB */}
      {activeTab === 'journal' && (
        <div className="max-w-7xl mx-auto bg-[#121724] p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="font-bold text-base text-white">יומן עסקאות שמור</h2>
          {trades.length === 0 ? <p className="text-xs text-slate-500 text-center py-8">אין עסקאות שמורות.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs font-mono">
                <thead>
                  <tr className="bg-[#182032] text-slate-400 border-b border-slate-800">
                    <th className="p-3">תאריך</th>
                    <th className="p-3">צמד</th>
                    <th className="p-3">סשן</th>
                    <th className="p-3">ציון</th>
                    <th className="p-3">סיכון</th>
                    <th className="p-3">PnL ($)</th>
                    <th className="p-3 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {trades.map(t => (
                    <tr key={t.id}>
                      <td className="p-3 text-slate-300">{t.date}</td>
                      <td className="p-3 font-bold text-white">{t.pair}</td>
                      <td className="p-3">{t.session}</td>
                      <td className="p-3 text-cyan-400 font-bold">{t.score}%</td>
                      <td className="p-3">${t.riskAmount}</td>
                      <td className={`p-3 font-bold ${parseFloat(t.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${t.pnl}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDeleteTrade(t.id)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Win Rate</span>
            <span className="text-3xl font-black font-mono text-emerald-400">{analytics.winRate}%</span>
          </div>
          <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">רווח מצטבר</span>
            <span className="text-3xl font-black font-mono text-emerald-400">${analytics.totalPnl}</span>
          </div>
          <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">ממוצע R:R</span>
            <span className="text-3xl font-black font-mono text-cyan-400">{analytics.avgR}R</span>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
