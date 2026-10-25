import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Target, FileText, Activity, Trash2, Award, Plus, Sparkles, RefreshCw, 
  Upload, Cpu, BarChart2, CheckCircle2, AlertTriangle, Edit3, Save, Settings, DollarSign
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

  const [initialAccountSize, setInitialAccountSize] = useState(() => {
    const saved = localStorage.getItem('scalp_journal_account_size');
    return saved ? saved : '10900';
  });

  const [editingTradeId, setEditingTradeId] = useState(null);

  // FORM STATE
  const [pair, setPair] = useState('EUR/USD');
  const [customPair, setCustomPair] = useState('');
  const [tradeType, setTradeType] = useState('LONG');
  const [tradeStatus, setTradeStatus] = useState('ACTIVE');
  const [session, setSession] = useState('London Session');
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
  const [zoneType, setZoneType] = useState('none'); 
  const [isFlipZone, setIsFlipZone] = useState(false);
  const [isPricingValid, setIsPricingValid] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('scalp_journal_account_size', initialAccountSize);
  }, [initialAccountSize]);

  const currentAccountBalance = useMemo(() => {
    const closedPnL = trades
      .filter(t => t.status === 'CLOSED')
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    return (parseFloat(initialAccountSize) || 10900) + closedPnL;
  }, [trades, initialAccountSize]);

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
        const res = await fetch(`
