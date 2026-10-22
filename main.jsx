import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Target, FileText, Activity, Trash2, Award, Plus, Sparkles, RefreshCw, 
  Upload, Cpu, BarChart2, CheckCircle2, AlertTriangle, Edit3, Save, Settings, RotateCcw, AlertCircle
} from 'lucide-react';

const IMGBB_API_KEY = '05116cd2c809aa58812f297232dfec8d';

const PAIR_OPTIONS = [
  'EUR/USD', 'USD/CHF', 'NZD/USD', 'XAU/USD', 'USD/JPY',
  'EUR/GBP', 'GBP/USD', 'USD/CAD', 'EUR/CHF', 'EUR/JPY', 'AUD/USD', 'CUSTOM'
];

const DEFAULT_WEIGHTS = {
  htfTrend: 10,
  mtfTrend: 10,
  ltfTrend: 5,
  zoneStandard: 10,
  zoneExtreme: 20,
  isFlipZone: 5,
  isPricingValid: 5,
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
  const [activeTab, setActiveTab] = useState('calculator');
  
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('scalp_journal_trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [weights, setWeights] = useState(() => {
    const saved = localStorage.getItem('scalp_journal_weights');
    return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
  });

  const [editingTradeId, setEditingTradeId] = useState(null);

  // FORM STATE
  const [pair, setPair] = useState('EUR/USD');
  const [customPair, setCustomPair] = useState('');
  const [tradeType, setTradeType] = useState('LONG');
  const [tradeStatus, setTradeStatus] = useState('ACTIVE');
  const [session, setSession] = useState('London Session');
  const [accountSize] = useState('10900');
  const [riskAmount, setRiskAmount] = useState('109');
  const [tradeResult, setTradeResult] = useState('WIN');
  const [pnlAmount, setPnlAmount] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');

  // PRE-FLIGHT CHECK
  const [newsChecked, setNewsChecked] = useState(false);

  // CONFLUENCE OPTIONS
  const [htfTrend, setHtfTrend] = useState(false);
  const [mtfTrend, setMtfTrend] = useState(false);
  const [ltfTrend, setLtfTrend] = useState(false);
  
  // 02: ZONES, FLIP, PRICING & FVG
  const [zoneType, setZoneType] = useState('none'); 
  const [isFlipZone, setIsFlipZone] = useState(false);
  const [isPricingValid, setIsPricingValid] = useState(false); // Discount for LONG / Premium for SHORT
  const [hasImbalance, setHasImbalance] = useState(false);
  
  const [liquidityType, setLiquidityType] = useState('none');
  const [vShapeLiq, setVShapeLiq] = useState(false);
  const [shiftType, setShiftType] = useState('none');
  const [trapsCount, setTrapsCount] = useState(0);
  const [selectedModel, setSelectedModel] = useState('none');

  // SCREENSHOTS & LOADING STATE
  const [images, setImages] = useState({ htf: null, mtf: null, ltf: null, entry: null, model: null });
  const [uploadingImageKey, setUploadingImageKey] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  useEffect(() => {
    localStorage.setItem('scalp_journal_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('scalp_journal_weights', JSON.stringify(weights));
  }, [weights]);

  const currentAccountBalance = useMemo(() => {
    const closedPnL = trades
      .filter(t => t.status === 'CLOSED')
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    return (parseFloat(accountSize) || 10900) + closedPnL;
  }, [trades, accountSize]);

  const calculatedScore = useMemo(() => {
    let score = 0;
    if (htfTrend) score += (weights.htfTrend || 0);
    if (mtfTrend) score += (weights.mtfTrend || 0);
    if (ltfTrend) score += (weights.ltfTrend || 0);
    
    if (zoneType === 'standard') score += (weights.zoneStandard || 0);
    if (zoneType === 'extreme') score += (weights.zoneExtreme || 0);
    if (isFlipZone) score += (weights.isFlipZone || 0);
    if (isPricingValid) score += (weights.isPricingValid || 0);
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
  }, [htfTrend, mtfTrend, ltfTrend, zoneType, isFlipZone, isPricingValid, hasImbalance, liquidityType, vShapeLiq, shiftType, trapsCount, selectedModel, weights]);

  const setupGrade = useMemo(() => {
    if (calculatedScore >= 85) return { grade: 'A+', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500', desc: 'Setup עילאי - כניסה מומלצת בביטחון מלא' };
    if (calculatedScore >= 75) return { grade: 'A', color: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500', desc: 'Setup איכותי - עומד בכללי האסטרטגיה' };
    if (calculatedScore >= 60) return { grade: 'B+', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500', desc: 'Setup בינוני-גבוה - מומלץ לחכות לאישור LTF' };
    if (calculatedScore >= 50) return { grade: 'B', color: 'text-orange-400', badge: 'bg-orange-500/20 border-orange-500', desc: 'גבולי - סיכון מוגבר' };
    return { grade: 'C', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500', desc: 'סיכון גבוה - להימנע מביצוע העסקה' };
  }, [calculatedScore]);

  const handleImageUpload = async (key, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (IMGBB_API_KEY && IMGBB_API_KEY !== 'YOUR_IMGBB_API_KEY') {
      setUploadingImageKey(key);
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          setImages(prev => ({ ...prev, [key]: data.data.url }));
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => setImages(prev => ({ ...prev, [key]: reader.result }));
        reader.readAsDataURL(file);
      } finally {
        setUploadingImageKey(null);
      }
    } else {
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
      
      const promptText = `אתה אנליסט מומחה למסחר לפי שיטת 1% Percent Club (Brad) ו-SMC/ICT.
בצע ניתוח מקיף לניתוח לפני כניסה לעסקה (Pre-Trade Staging):

פרטי ה-Setup:
- צמד: ${pair === 'CUSTOM' ? customPair : pair} | כיוון: ${tradeType} | סשן: ${session}
- ציון Confluence: ${calculatedScore}% | דירוג עסקה מחושב: ${setupGrade.grade}
- מגמות: HTF 1H=${htfTrend ? 'כן' : 'לא'}, MTF 15m=${mtfTrend ? 'כן' : 'לא'}, LTF 1m=${ltfTrend ? 'כן' : 'לא'}
- אזור: ${zoneType}, Flip Zone: ${isFlipZone ? 'כן' : 'לא'}, פרימיום/דיסקונט מוצדק: ${isPricingValid ? 'כן' : 'לא'}, Imbalance (FVG): ${hasImbalance ? 'כן' : 'לא'}
- נזילות: ${liquidityType}, V-Shape: ${vShapeLiq ? 'כן' : 'לא'}
- שיפט: ${shiftType}, מלכודות: ${trapsCount}, מודל כניסה: ${selectedModel}
- בדיקת הודעות כלכליות: ${newsChecked ? 'אושר ע"י הסוחר' : 'טרם אושר'}
- יתרת חשבון: $${currentAccountBalance}, סיכון 1%: $${riskAmount}
- הערות ודגשים מהסוחר: "${tradeNotes || 'אין הערות נוספות'}"

הנחיות לתשובה בעברית:
1. **דירוג והערכת Setup:** האם הדירוג (${setupGrade.grade}) מוצדק והאם הניתוח בוצע נכון?
2. **ניתוח תמונות והקשר:** האם מבנה השוק והכניסה תואמים את המודל הנבחר?
3. **המלצה סופית וחד-משמעית:** רשום במפורש: [כניסה מומלצת / להמתין לאישור נוסף / להימנע מביצוע].
4. **ניהול סיכונים:** וודא יעד רווח מינימלי של 3R ($${(parseFloat(riskAmount) * 3).toFixed(0)}).`;

      if (apiKey) {
        const activeImageParts = [];
        for (const key of ['htf', 'mtf', 'ltf', 'entry', 'model']) {
          if (images[key]) {
            if (images[key].startsWith('data:image')) {
              const base64Data = images[key].split(',')[1];
              const mimeType = images[key].split(';')[0].split(':')[1];
              activeImageParts.push({ inlineData: { mimeType, data: base64Data } });
            }
          }
        }

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

      setTimeout(() => {
        setAiFeedback({
          summary: `📊 **דירוג עסקה:** ${setupGrade.grade} (ציון ${calculatedScore}%)
• **הערכת ניתוח:** ${calculatedScore >= 75 ? 'ה-Setup מתוכנן היטב לפי כללי ה-1% Percent Club.' : 'ה-Setup כולל חסרים במרכיבי Confluence מרכזיים.'}
• **סנכרון מגמות:** ${htfTrend && mtfTrend ? 'סנכרון מלא בין 1H ל-15m.' : 'חסר סנכרון מגמה מלא.'}
• **אזור ומתחור:** ${isFlipZone ? 'זוהה Flip Zone.' : ''} ${isPricingValid ? 'מיקום תמחור תקין (Discount/Premium).' : ''}
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

  const handleSaveTrade = () => {
    if (!newsChecked) {
      alert('⚠️ חובה לסמן שבדקת שאין הודעות כלכליות קרובות שיכולות להשפיע על העסקה!');
      return;
    }

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

    setTradeNotes('');
    setPnlAmount('');
    setNewsChecked(false);
    setImages({ htf: null, mtf: null, ltf: null, entry: null, model: null });
  };

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
    setNewsChecked(true); // Pre-check on edit
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

        {/* ACCOUNT BALANCE */}
        <div className="flex gap-4 items-center bg-[#182032] px-4 py-2 rounded-xl border border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 block">יתרת חשבון (התחלה $10,900)</span>
            <span className="text-lg font-bold font-mono text-emerald-400">${currentAccountBalance.toLocaleString()}</span>
          </div>
          <div className="border-r border-slate-700 pr-4">
            <span className="text-[10px] text-slate-400 block">סיכון (1%)</span>
            <span className="text-lg font-bold font-mono text-cyan-400">${(currentAccountBalance * 0.01).toFixed(0)}</span>
          </div>
        </div>

        {/* TABS */}
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
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${activeTab === 'settings' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
            <Settings className="w-4 h-4" />
            <span>הגדרות</span>
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
                <span className="text-xs text-cyan-400 font-mono">משקל דינמי</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {['htf', 'mtf', 'ltf'].map((timeframeKey) => {
                  const label = timeframeKey === 'htf' ? `HTF שעתי (1H) +${weights.htfTrend}%` : timeframeKey === 'mtf' ? `MTF 15 דקות +${weights.mtfTrend}%` : `LTF 1 דקה +${weights.ltfTrend}%`;
                  const isChecked = timeframeKey === 'htf' ? htfTrend : timeframeKey === 'mtf' ? mtfTrend : ltfTrend;
                  const setChecked = timeframeKey === 'htf' ? setHtfTrend : timeframeKey === 'mtf' ? setMtfTrend : setLtfTrend;

                  return (
                    <div key={timeframeKey} className={`p-3 rounded-xl border space-y-2 ${isChecked ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-[#182032] border-slate-800'}`}>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input type="checkbox" checked={isChecked} onChange={(e) => setChecked(e.target.checked)} className="accent-cyan-500" />
                        <span>{label}</span>
                      </label>
                      <div className="relative aspect-video bg-[#0d1117] rounded-lg border border-dashed border-slate-700 flex items-center justify-center">
                        {uploadingImageKey === timeframeKey ? (
                          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                        ) : images[timeframeKey] ? (
                          <img src={images[timeframeKey]} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-500" />
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(timeframeKey, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 02: KEY ZONES & PRICING */}
            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex justify-between">
                <span>02. אזורי מפתח, Flip, תמחור ואימבאלנס (FVG)</span>
                <span className="text-xs text-emerald-400 font-mono">משקל דינמי</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-2">סוג האזור:</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setZoneType('none')} className={`w-full p-2.5 rounded-xl border text-right ${zoneType === 'none' ? 'bg-slate-800 border-slate-600' : 'bg-[#182032] border-slate-800'}`}>ללא אזור מיועד (0%)</button>
                    <button onClick={() => setZoneType('standard')} className={`w-full p-2.5 rounded-xl border text-right ${zoneType === 'standard' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-[#182032] border-slate-800'}`}>Demand / Supply Zone (+{weights.zoneStandard}%)</button>
                    <button onClick={() => setZoneType('extreme')} className={`w-full p-2.5 rounded-xl border text-right ${zoneType === 'extreme' ? 'bg-emerald-500/30 border-emerald-400 font-bold' : 'bg-[#182032] border-slate-800'}`}>Extreme Zone בקצה המבנה (+{weights.zoneExtreme}%)</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 block mb-1">מאפייני אזור נוספים:</label>
                  
                  {/* FLIP ZONE CHECKBOX */}
                  <label onClick={() => setIsFlipZone(!isFlipZone)} className={`cursor-pointer p-2.5 rounded-xl border flex items-center gap-3 transition-all ${isFlipZone ? 'bg-emerald-500/20 border-emerald-500' : 'bg-[#182032] border-slate-800'}`}>
                    <input type="checkbox" checked={isFlipZone} onChange={() => {}} className="accent-emerald-500" />
                    <div>
                      <span className="font-bold block">האם ה-Zone היה Flip Zone?</span>
                      <span className="text-[10px] text-slate-400 block">+{weights.isFlipZone}% משקל הסתברות</span>
                    </div>
                  </label>

                  {/* PREMIUM / DISCOUNT CHECKBOX */}
                  <label onClick={() => setIsPricingValid(!isPricingValid)} className={`cursor-pointer p-2.5 rounded-xl border flex items-center gap-3 transition-all ${isPricingValid ? 'bg-emerald-500/20 border-emerald-500' : 'bg-[#182032] border-slate-800'}`}>
                    <input type="checkbox" checked={isPricingValid} onChange={() => {}} className="accent-emerald-500" />
                    <div>
                      <span className="font-bold block">תמחור: Discount (בלונג) / Premium (בשורט)?</span>
                      <span className="text-[10px] text-slate-400 block">+{weights.isPricingValid}% משקל הסתברות</span>
                    </div>
                  </label>

                  {/* FVG / IMBALANCE CHECKBOX */}
                  <label onClick={() => setHasImbalance(!hasImbalance)} className={`cursor-pointer p-2.5 rounded-xl border flex items-center gap-3 transition-all ${hasImbalance ? 'bg-emerald-500/20 border-emerald-500' : 'bg-[#182032] border-slate-800'}`}>
                    <input type="checkbox" checked={hasImbalance} onChange={() => {}} className="accent-emerald-500" />
                    <div>
                      <span className="font-bold block">Imbalance / FVG קיים</span>
                      <span className="text-[10px] text-slate-400 block">+{weights.hasImbalance}% משקל הסתברות</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 03: LIQUIDITY SWEEPS */}
            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex justify-between">
                <span>03. שתיית נזילות (Liquidity Sweeps)</span>
                <span className="text-xs text-amber-400 font-mono">משקל דינמי</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-2">סוג אינדוסמנט:</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setLiquidityType('none')} className={`w-full p-2 rounded-lg border text-right ${liquidityType === 'none' ? 'bg-slate-800 border-slate-600' : 'bg-[#182032] border-slate-800'}`}>ללא אינדוסמנט (0%)</button>
                    <button onClick={() => setLiquidityType('push')} className={`w-full p-2 rounded-lg border text-right ${liquidityType === 'push' ? 'bg-amber-500/20 border-amber-500' : 'bg-[#182032] border-slate-800'}`}>Push Inducement (+{weights.liqPush}%)</button>
                    <button onClick={() => setLiquidityType('pull')} className={`w-full p-2 rounded-lg border text-right ${liquidityType === 'pull' ? 'bg-amber-500/20 border-amber-500' : 'bg-[#182032] border-slate-800'}`}>Pull Inducement (+{weights.liqPull}%)</button>
                    <button onClick={() => setLiquidityType('both')} className={`w-full p-2 rounded-lg border text-right font-bold ${liquidityType === 'both' ? 'bg-amber-500/30 border-amber-400' : 'bg-[#182032] border-slate-800'}`}>שילוב Push & Pull (+{weights.liqBoth}%)</button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-2">V-Shape Liquidity:</label>
                  <label onClick={() => setVShapeLiq(!vShapeLiq)} className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 ${vShapeLiq ? 'bg-amber-500/20 border-amber-500' : 'bg-[#182032] border-slate-800'}`}>
                    <input type="checkbox" checked={vShapeLiq} onChange={() => {}} className="accent-amber-500" />
                    <div>
                      <span className="font-bold block text-amber-200">נזילות V-Shape</span>
                      <span className="text-[10px] text-slate-400 block">דחייה מהירה (+{weights.vShapeLiq}%)</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 04: MARKET SHIFT & NOTES */}
            <div className="bg-[#121724] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 flex justify-between">
                <span>04. שינוי מבנה (Shift) + מודלים</span>
                <span className="text-xs text-purple-4
