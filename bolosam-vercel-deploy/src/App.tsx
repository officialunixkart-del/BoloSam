import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic, Volume2, Send, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, X, NotebookText, ChartPie,
  Target, Bell, BellRing, Calculator, Info, Store, Coffee, CarFront, ReceiptText, Shapes, Search, Plus,
  Trash2, Sparkles, Wallet, Languages, Ear, Brain, Clock3, CheckCircle2, TriangleAlert, ChevronRight,
  IndianRupee, ShoppingBasket, Bike, Users, Zap, CircleDollarSign, CalendarDays, ListFilter, Play, Landmark,
  LayoutDashboard, Menu
} from "lucide-react";

// ---- Vercel / standalone data layer (localStorage, no backend needed) ----
export type Txn = { id: number; type: string; title: string; amount: number; category: string; txn_date: string; is_demo: boolean; created_at: string };
export type Reminder = { id: number; title: string; due_label: string; done: boolean; created_at: string };
export type AppState = { transactions: Txn[]; reminders: Reminder[]; budgetLimit: number };

const LS_KEY = "bolosam-state-v1";
let _id = Date.now();
function nextId() { _id += 1; return _id; }
function todayStr(offsetDays = 0): string {
  const d = new Date(); d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function seedState(): AppState {
  const t0 = todayStr(0), t1 = todayStr(1), t3 = todayStr(3), t6 = todayStr(6);
  const demos: Array<[string, string, number, string, string]> = [
    ["sale", "Subah ki bikri — atta, chawal, dal", 2450, "Kirana & Stock", t0],
    ["sale", "UPI sale — Sharma ji", 850, "Kirana & Stock", t0],
    ["expense", "Chai aur nashta", 150, "Food & Chai", t0],
    ["expense", "Auto bhada — mandi trip", 320, "Transport & Fuel", t0],
    ["sale", "Shaam ki bikri", 1780, "Kirana & Stock", t1],
    ["expense", "Doodh aur bread stock", 940, "Kirana & Stock", t1],
    ["expense", "Bijli bill", 1250, "Bills & Utilities", t3],
    ["sale", "Hafte ki bikri — mithaas counter", 3200, "Kirana & Stock", t3],
    ["expense", "Petrol — delivery scooty", 500, "Transport & Fuel", t6],
    ["expense", "Dopahar ka khana", 220, "Food & Chai", t6],
  ];
  return {
    transactions: demos.map(([type, title, amount, category, txn_date]) => ({ id: nextId(), type, title, amount, category, txn_date, is_demo: true, created_at: new Date().toISOString() })),
    reminders: [
      { id: nextId(), title: "Sharma ji ko call — udhaar follow-up", due_label: "Kal 10 baje", done: false, created_at: new Date().toISOString() },
      { id: nextId(), title: "Supplier ko payment — atta stock", due_label: "Aaj shaam 6 baje", done: false, created_at: new Date().toISOString() },
    ],
    budgetLimit: 10000,
  };
}
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const p = JSON.parse(raw) as AppState; if (Array.isArray(p.transactions)) return p; }
  } catch { /* ignore */ }
  const s = seedState(); try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ } return s;
}
function saveState(s: AppState) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ } }



const CATEGORIES = ["Kirana & Stock", "Food & Chai", "Transport & Fuel", "Bills & Utilities", "Other"] as const;
const CAT_COLORS: Record<string, string> = { "Kirana & Stock": "#166534", "Food & Chai": "#F59E0B", "Transport & Fuel": "#2563EB", "Bills & Utilities": "#DC2626", Other: "#7C3AED" };

function CatIcon({ cat, size = 18, className = "" }: { cat: string; size?: number; className?: string }) {
  const props = { size, className, strokeWidth: 2.2 } as const;
  if (cat === "Kirana & Stock") return <ShoppingBasket {...props} />;
  if (cat === "Food & Chai") return <Coffee {...props} />;
  if (cat === "Transport & Fuel") return <CarFront {...props} />;
  if (cat === "Bills & Utilities") return <ReceiptText {...props} />;
  return <Shapes {...props} />;
}
function SectionHead({ icon, title, sub, color = "#166534", bg = "#DCFCE7" }: { icon: React.ReactNode; title: string; sub?: string; color?: string; bg?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="icon-tile h-11 w-11" style={{ background: bg, color }}>{icon}</div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[22px] leading-6 font-extrabold tracking-tight">{title}</h2>
        {sub && <p className="text-[13px] leading-5 mt-0.5" style={{ color: "var(--dim)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function inr(n: number) { return "₹" + Math.abs(n).toLocaleString("en-IN"); }
function todayISO() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function speak(text: string, lang: string) { try { if (!("speechSynthesis" in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = 0.95; window.speechSynthesis.speak(u); } catch { /* noop */ } }
function ringSound() { try { const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const ctx = new Ctx(); [880, 1108, 880, 1108].forEach((f, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.22); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.22 + 0.2); o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * 0.22); o.stop(ctx.currentTime + i * 0.22 + 0.22); }); } catch { /* noop */ } }
function detectCategory(text: string): string { const t = text.toLowerCase(); if (/chai|tea|khana|nashta|food|kharcha.*kha|tiffin|lunch|dinner/.test(t)) return "Food & Chai"; if (/petrol|diesel|auto|rickshaw|bhada|transport|fuel|bus|train/.test(t)) return "Transport & Fuel"; if (/bijli|bill|light|paani|water|electric|rent|kiraya|mobile recharge|recharge/.test(t)) return "Bills & Utilities"; if (/stock|kirana|atta|chawal|dal|doodh|milk|sabzi|grocery|maal/.test(t)) return "Kirana & Stock"; return "Other"; }
type Parsed = { kind: "sale" | "expense" | "reminder" | "math" | "summary" | "unknown"; amount?: number; category?: string; result?: number; expr?: string; title?: string; dueLabel?: string; reply: string };
function parseCommand(raw: string, totals: { sales: number; expenses: number; net: number }): Parsed {
  const text = raw.trim(); const t = text.toLowerCase();
  const pct = t.match(/(\d+(?:\.\d+)?)\s*(?:percent|%|pratishat|feesadi)[^0-9]*(\d+(?:\.\d+)?)/i) || t.match(/(\d+(?:\.\d+)?)\s*(?:of|ka|ke)\s*(\d+(?:\.\d+)?)\s*(?:percent|%)/i);
  const pct2 = t.match(/(\d+(?:\.\d+)?)\s*(?:percent|%)\s*(?:of|ka)?\s*(\d+(?:\.\d+)?)/i);
  const m = pct2 || pct;
  if (m && m[1] && m[2] && (/percent|%|pratishat|kitna/.test(t))) { const p = parseFloat(m[1]); const base = parseFloat(m[2]); const result = Math.round((p / 100) * base * 100) / 100; return { kind: "math", result, expr: `${p}% of ${base}`, reply: `${p} percent of ${base} hota hai ${result} rupaye.` }; }
  const arith = t.match(/(\d+(?:\.\d+)?)\s*([+\-*/x×])\s*(\d+(?:\.\d+)?)/);
  if (arith && arith[1] && arith[2] && arith[3] && /kitna|calculate|hisab karo|jodo|guna/.test(t)) { const a = parseFloat(arith[1]); const b = parseFloat(arith[3]); const op = arith[2]; const result = op === "+" ? a + b : op === "-" ? a - b : op === "/" ? (b ? a / b : 0) : a * b; return { kind: "math", result: Math.round(result * 100) / 100, expr: `${a} ${op} ${b}`, reply: `Jawab hai ${Math.round(result * 100) / 100}.` }; }
  if (/hisab|summary|batao.*aaj|aaj ka/.test(t) && !/\d/.test(t)) return { kind: "summary", reply: `Aaj ka hisab: Kul bikri ${inr(totals.sales)}, kul kharcha ${inr(totals.expenses)}, aur munafa ${inr(totals.net)} hai.` };
  if (/hisab batao|aaj ka hisab|daily summary/.test(t)) return { kind: "summary", reply: `Aaj ka hisab: Kul bikri ${inr(totals.sales)}, kul kharcha ${inr(totals.expenses)}, aur munafa ${inr(totals.net)} hai.` };
  const numMatch = t.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/); const amount = numMatch && numMatch[1] ? Math.round(parseFloat(numMatch[1])) : undefined;
  if (/reminder|yaad|remind/.test(t)) { let due = ""; if (/kal/.test(t)) due = "Kal"; const timeM = t.match(/(\d{1,2})\s*baje/); if (timeM) due = (due ? due + " " : "") + `${timeM[1]} baje`; if (/aaj/.test(t)) due = due ? `Aaj ${due.replace("Kal ", "")}` : "Aaj"; if (/shaam/.test(t)) due += " shaam"; const title = text.replace(/reminder/gi, "").trim() || "Reminder"; return { kind: "reminder", title, dueLabel: due || "Jaldi", reply: `Theek hai, reminder set kar diya: ${title}${due ? ` — ${due}` : ""}.` }; }
  if (/kharcha|expense|kharch|debit|lagaya|diya/.test(t) || (/chai|petrol|bijli|bill/.test(t) && amount)) { if (amount) { const cat = detectCategory(t); return { kind: "expense", amount, category: cat, title: text, reply: `${amount} rupaye ka kharcha ${cat} mein jod diya. Dhanyavaad!` }; } }
  if (/bikri|sale|becha|sold|credit|aaya|mile/.test(t) || amount) { if (amount) { const cat = detectCategory(t) === "Other" ? "Kirana & Stock" : detectCategory(t); return { kind: "sale", amount, category: cat, title: text, reply: `Bahut badhiya! ${amount} rupaye ki bikri jod di gayi.` }; } }
  return { kind: "unknown", reply: "Samajh nahi aaya. Ek example try karo: '500 rupaye ki bikri hui' ya '150 ka kharcha chai pe'." };
}
function evalExpr(expr: string): number | null {
  const tokens: Array<number | string> = []; let i = 0;
  while (i < expr.length) { const ch = expr[i] ?? ""; if (ch === " ") { i++; continue; } if (/[\d.]/.test(ch)) { let num = ""; while (i < expr.length && /[\d.]/.test(expr[i] ?? "")) { num += expr[i]; i++; } tokens.push(parseFloat(num)); continue; } if ("+-*/%()".includes(ch)) { tokens.push(ch); i++; continue; } return null; }
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 }; const out: Array<number | string> = []; const ops: string[] = [];
  for (const tok of tokens) { if (typeof tok === "number") { out.push(tok); continue; } if (tok === "(") { ops.push(tok); continue; } if (tok === ")") { while (ops.length && ops[ops.length - 1] !== "(") { const o = ops.pop(); if (o) out.push(o); } if (!ops.length) return null; ops.pop(); continue; } while (ops.length) { const top = ops[ops.length - 1] ?? ""; if (top !== "(" && (prec[top] ?? 0) >= (prec[tok] ?? 0)) { const o = ops.pop(); if (o) out.push(o); } else break; } ops.push(tok); }
  while (ops.length) { const o = ops.pop(); if (!o || o === "(") return null; out.push(o); }
  const stack: number[] = []; for (const tok of out) { if (typeof tok === "number") { stack.push(tok); continue; } const b = stack.pop(); const a = stack.pop(); if (a == null || b == null) return null; if (tok === "+") stack.push(a + b); else if (tok === "-") stack.push(a - b); else if (tok === "*") stack.push(a * b); else if (tok === "/") { if (b === 0) return null; stack.push(a / b); } else if (tok === "%") stack.push((a / 100) * b); else return null; }
  return stack.length === 1 ? (stack[0] ?? null) : null;
}
function Donut({ data }: { data: Array<{ cat: string; amt: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.amt, 0);
  if (total === 0) return <div className="py-10 text-center text-sm" style={{ color: "var(--dim)" }}>Is period mein koi data nahi hai.</div>;
  let acc = 0; const R = 70; const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div className="relative shrink-0">
        <svg viewBox="0 0 200 200" className="h-52 w-52 -rotate-90 drop-shadow-sm" role="img" aria-label="Category donut chart">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border)" strokeWidth="26" />
          {data.filter((d) => d.amt > 0).map((d) => { const frac = d.amt / total; const dash = frac * C; const offset = -acc * C; acc += frac; return <circle key={d.cat} cx="100" cy="100" r={R} fill="none" stroke={d.color} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${Math.max(0, dash - 3)} ${C - dash + 3}`} strokeDashoffset={offset} />; })}
          <text x="100" y="94" textAnchor="middle" transform="rotate(90 100 100)" fontSize="11" fontWeight="700" fill="var(--dim)">TOTAL</text>
          <text x="100" y="118" textAnchor="middle" transform="rotate(90 100 100)" className="font-display" fontSize="17" fontWeight="800" fill="var(--text)">{inr(total)}</text>
        </svg>
      </div>
      <ul className="w-full max-w-xs space-y-2">
        {data.map((d) => (
          <li key={d.cat} className="flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <span className="flex items-center gap-2.5 min-w-0"><span className="icon-tile h-8 w-8 text-white" style={{ background: d.color }}><CatIcon cat={d.cat} size={16} /></span><span className="truncate font-semibold">{d.cat}</span></span>
            <span className="text-right shrink-0"><span className="block font-extrabold leading-4">{inr(d.amt)}</span><span className="text-[11px]" style={{ color: "var(--dim)" }}>{total ? Math.round((d.amt / total) * 100) : 0}%</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "voice", label: "Voice", Icon: Mic },
  { id: "khata", label: "Khata", Icon: NotebookText },
  { id: "report", label: "Report", Icon: ChartPie },
  { id: "budget", label: "Budget", Icon: Target },
  { id: "yaad", label: "Yaad", Icon: Bell },
  { id: "calculator", label: "Calculator", Icon: Calculator },
  { id: "about", label: "About", Icon: Info },
] as const;

export function App() {
  const [data, setData] = useState<AppState>(() => loadState());
  const state = { isPending: false, error: null as Error | null, refetch: () => setData(loadState()) };
  const txns: Txn[] = data.transactions;
  const reminders: Reminder[] = data.reminders;
  const budgetLimit = data.budgetLimit;
  function update(fn: (s: AppState) => AppState) { setData((prev) => { const n = fn(prev); saveState(n); return n; }); }
  const hasDemo = txns.some((t) => t.is_demo);
  const [period, setPeriod] = useState<"today" | "month" | "all">("today");
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState("hi-IN");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedInfo, setParsedInfo] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [typedCmd, setTypedCmd] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceErrorKind, setVoiceErrorKind] = useState<"error" | "info" | "permission">("error");
  const [interim, setInterim] = useState("");
  const recRef = useRef<{ stop: () => void } | null>(null);
  const gotResultRef = useRef(false);
  const [mType, setMType] = useState<"sale" | "expense">("sale");
  const [mTitle, setMTitle] = useState(""); const [mAmount, setMAmount] = useState(""); const [mCat, setMCat] = useState<string>("Kirana & Stock"); const [mDate, setMDate] = useState(todayISO()); const [mError, setMError] = useState("");
  const [analyticsType, setAnalyticsType] = useState<"expense" | "sale">("expense");
  const [budgetInput, setBudgetInput] = useState(""); const [budgetError, setBudgetError] = useState("");
  const [rTitle, setRTitle] = useState(""); const [rDue, setRDue] = useState(""); const [rError, setRError] = useState("");
  const [calcDisplay, setCalcDisplay] = useState("0"); const [calcExpr, setCalcExpr] = useState(""); const [calcResult, setCalcResult] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState<string>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  function goToSection(id: string) {
    setActiveNav(id);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  useEffect(() => {
    if (state.isPending) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) setActiveNav(e.target.id); }
    }, { rootMargin: "-25% 0px -65% 0px" });
    for (const n of NAV_ITEMS) { const el = document.getElementById(n.id); if (el) obs.observe(el); }
    return () => obs.disconnect();
  }, [state.isPending]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const addTxn = { mutate: (v: { type: "sale" | "expense"; title: string; amount: number; category: string; txn_date: string }, opts?: { onSuccess?: () => void }) => { update((s) => ({ ...s, transactions: [{ id: nextId(), type: v.type, title: v.title, amount: v.amount, category: v.category, txn_date: v.txn_date, is_demo: false, created_at: new Date().toISOString() }, ...s.transactions] })); opts?.onSuccess?.(); } };
  const delTxn = { mutate: (id: number) => update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })) };
  const clearDemo = { mutate: () => update((s) => ({ ...s, transactions: s.transactions.filter((t) => !t.is_demo) })) };
  const addRem = { mutate: (v: { title: string; due_label: string }, opts?: { onSuccess?: () => void }) => { update((s) => ({ ...s, reminders: [{ id: nextId(), title: v.title, due_label: v.due_label, done: false, created_at: new Date().toISOString() }, ...s.reminders] })); opts?.onSuccess?.(); } };
  const toggleRem = { mutate: (v: { id: number; done: boolean }) => update((s) => ({ ...s, reminders: s.reminders.map((r) => r.id === v.id ? { ...r, done: v.done } : r) })) };
  const delRem = { mutate: (id: number) => update((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) })) };
  const setBudgetMut = { mutate: (v: number, opts?: { onSuccess?: () => void }) => { update((s) => ({ ...s, budgetLimit: v })); opts?.onSuccess?.(); } };
  const today = todayISO(); const monthPrefix = today.slice(0, 7);
  const filteredByPeriod = useMemo(() => txns.filter((t) => period === "all" ? true : period === "today" ? t.txn_date === today : t.txn_date.startsWith(monthPrefix)), [txns, period, today, monthPrefix]);
  const salesTotal = filteredByPeriod.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0);
  const expTotal = filteredByPeriod.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = salesTotal - expTotal;
  const monthTxns = useMemo(() => txns.filter((t) => t.txn_date.startsWith(monthPrefix)), [txns, monthPrefix]);
  const monthExp = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const budgetPct = budgetLimit > 0 ? Math.min(100, Math.round((monthExp / budgetLimit) * 100)) : 0;
  const overBudget = monthExp > budgetLimit;
  const searched = useMemo(() => { const q = search.trim().toLowerCase(); if (!q) return filteredByPeriod; return filteredByPeriod.filter((t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.txn_date.includes(q) || String(t.amount).includes(q)); }, [filteredByPeriod, search]);
  const donutData = useMemo(() => { const src = filteredByPeriod.filter((t) => t.type === analyticsType); return CATEGORIES.map((cat) => ({ cat, amt: src.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0), color: CAT_COLORS[cat] ?? "#666" })); }, [filteredByPeriod, analyticsType]);
  function focusTypedInput() {
    const el = document.getElementById("typed-cmd") as HTMLInputElement | null;
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); window.setTimeout(() => el.focus(), 250); }
  }
  function handleCommand(raw: string) {
    setVoiceError("");
    const todayTxns = txns.filter((t) => t.txn_date === today); const totals = { sales: todayTxns.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0), expenses: todayTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), net: 0 }; totals.net = totals.sales - totals.expenses;
    const parsed = parseCommand(raw, totals); setTranscript(raw); setLastReply(parsed.reply);
    if (parsed.kind === "sale" && parsed.amount) { setParsedInfo(`Bikri (Sale) · ${inr(parsed.amount)} · ${parsed.category}`); addTxn.mutate({ type: "sale", title: raw.slice(0, 120), amount: parsed.amount, category: parsed.category ?? "Kirana & Stock", txn_date: today }); }
    else if (parsed.kind === "expense" && parsed.amount) { setParsedInfo(`Kharcha (Expense) · ${inr(parsed.amount)} · ${parsed.category}`); addTxn.mutate({ type: "expense", title: raw.slice(0, 120), amount: parsed.amount, category: parsed.category ?? "Other", txn_date: today }); }
    else if (parsed.kind === "reminder") { setParsedInfo(`Yaad (Reminder) · ${parsed.dueLabel}`); addRem.mutate({ title: parsed.title ?? raw, due_label: parsed.dueLabel ?? "" }); }
    else if (parsed.kind === "math" && parsed.result != null) { setParsedInfo(`Hisab (Math) · ${parsed.expr} = ${parsed.result}`); setCalcDisplay(String(parsed.result)); setCalcResult(parsed.result); setCalcExpr(parsed.expr ?? ""); }
    else if (parsed.kind === "summary") setParsedInfo("Hisab (Daily Summary)");
    else setParsedInfo("Samajh nahi aaya — neeche example chip try karo");
    speak(parsed.reply, lang);
  }
  function stopListening() {
    try { recRef.current?.stop(); } catch { /* already stopped */ }
    setListening(false);
  }
  async function startListening(fallbackLang?: string) {
    // Tap again while listening = stop (toggle), don't start a second session.
    if (listening && !fallbackLang) { stopListening(); return; }
    setVoiceError(""); setVoiceErrorKind("error"); setInterim("");
    gotResultRef.current = false;
    const useLang = fallbackLang ?? lang;
    type SRAlt = { transcript: string };
    type SRRes = ArrayLike<SRAlt> & { isFinal: boolean };
    type SREvent = { resultIndex: number; results: ArrayLike<SRRes> };
    type SRInstance = { lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number; onresult: ((e: SREvent) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
    const w = window as unknown as { SpeechRecognition?: new () => SRInstance; webkitSpeechRecognition?: new () => SRInstance };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceErrorKind("permission");
      setVoiceError("Is browser / app mein voice sunna (Speech Recognition) uplabdh nahi hai. Chrome ya Edge mein kholo — ya neeche type karke / example chip dabakar entry karo.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setVoiceErrorKind("permission");
      setVoiceError("Mic ke liye secure (HTTPS) page chahiye. Page ko HTTPS par kholo, ya neeche type karke entry karo.");
      return;
    }
    // Stop any spoken reply first — synthesis playing while listening causes instant 'no-speech' / aborted errors.
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    // Preflight mic permission so a blocked mic shows the real reason (permission)
    // instead of the old generic "sun nahi paya" for every failure.
    if (!fallbackLang && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((tr) => tr.stop());
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        setListening(false);
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
          setVoiceErrorKind("permission");
          setVoiceError("Mic permission nahi mili — isiliye sun nahi paya. Browser / app ki settings mein is page ke liye Microphone Allow karo, phir mic dobara dabao. Tab tak neeche type karke entry kar sakte ho.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
          setVoiceErrorKind("error");
          setVoiceError("Koi microphone nahi mila. Headset / mic jodo ya check karo ki koi dusri app mic to nahi use kar rahi — ya neeche type karo.");
        } else {
          setVoiceErrorKind("error");
          setVoiceError("Mic shuru nahi ho paya. Dobara try karo — ya neeche type karke entry karo.");
        }
        return;
      }
    }
    let rec: SRInstance;
    try { rec = new SR(); } catch {
      setVoiceErrorKind("permission");
      setVoiceError("Voice service shuru nahi ho payi. Chrome / Edge mein try karo — ya neeche type karke entry karo.");
      return;
    }
    rec.lang = useLang; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interimTxt = ""; let finalTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]; const txt = res?.[0]?.transcript ?? "";
        if (!txt) continue;
        if (res?.isFinal) finalTxt += txt; else interimTxt += txt;
      }
      if (interimTxt) setInterim(interimTxt);
      if (finalTxt.trim()) { gotResultRef.current = true; setInterim(""); handleCommand(finalTxt.trim()); }
    };
    rec.onerror = (e) => {
      setListening(false); setInterim("");
      const code = e?.error ?? "";
      if (code === "aborted") return; // user tapped stop — not an error
      if (code === "language-not-supported" && !fallbackLang && useLang !== "en-IN") {
        void startListening("en-IN");
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        setVoiceErrorKind("permission");
        setVoiceError("Mic permission block hai — isiliye sun nahi paya. Is page ke liye Microphone Allow karo (browser / app settings), phir mic dobara dabao. Tab tak neeche type karke entry kar sakte ho.");
      } else if (code === "no-speech") {
        setVoiceErrorKind("info");
        setVoiceError("Kuch sunai nahi diya — mic ke paas se, thoda saaf aur zor se bolo, phir dobara try karo. Jaise: “500 rupaye ki bikri hui”.");
      } else if (code === "audio-capture") {
        setVoiceErrorKind("error");
        setVoiceError("Mic se awaaz nahi mili. Check karo mic kisi dusri app mein to nahi chal raha — ya neeche type karo.");
      } else if (code === "network") {
        setVoiceErrorKind("error");
        setVoiceError("Voice sunne ke liye internet chahiye (browser ki speech service online chalti hai). Net check karke dobara try karo — ya neeche type karo.");
      } else {
        setVoiceErrorKind("error");
        setVoiceError("Mic se sun nahi paya. Dobara try karo ya type karo.");
      }
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    recRef.current = rec;
    try {
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setVoiceErrorKind("info");
      setVoiceError("Mic pehle se chal raha tha — ek second ruk kar dobara dabao.");
    }
  }
  function calcPress(key: string) {
    if (key === "C") { setCalcDisplay("0"); setCalcExpr(""); setCalcResult(null); return; }
    if (key === "=") { try { const expr = calcDisplay.replace(/×/g, "*").replace(/÷/g, "/"); if (!/^[\d+\-*/.()\s%]+$/.test(expr)) return; const val = evalExpr(expr); if (val == null || !isFinite(val)) { setCalcDisplay("Error"); return; } const rounded = Math.round(val * 100) / 100; setCalcResult(rounded); setCalcDisplay(String(rounded)); speak(`Total hai ${rounded} rupaye.`, lang); } catch { setCalcDisplay("Error"); } return; }
    setCalcDisplay((prev) => (prev === "0" || prev === "Error" ? key : prev + key));
  }
  function calcToEntry(type: "sale" | "expense") { const val = calcResult ?? parseFloat(calcDisplay); if (!val || isNaN(val) || val <= 0) return; addTxn.mutate({ type, title: `Calculator — ${calcExpr || calcDisplay}`, amount: Math.round(val), category: type === "sale" ? "Kirana & Stock" : "Other", txn_date: today }); speak(`${Math.round(val)} rupaye ${type === "sale" ? "bikri" : "kharcha"} mein jod diya.`, lang); }
  const examples = [
    { label: "500 rupaye ki bikri hui", cmd: "500 rupaye ki bikri hui", icon: <TrendingUp size={15} /> },
    { label: "150 ka kharcha chai pe", cmd: "150 ka kharcha chai pe", icon: <Coffee size={15} /> },
    { label: "Kal 10 baje Sharma ji ko call reminder", cmd: "Kal 10 baje Sharma ji ko call reminder", icon: <Bell size={15} /> },
    { label: "18 percent of 2500 kitna hota hai?", cmd: "18 percent of 2500 kitna hota hai?", icon: <Calculator size={15} /> },
    { label: "Aaj ka hisab batao", cmd: "Aaj ka hisab batao", icon: <Wallet size={15} /> },
  ];
  const ringR = 54; const ringC = 2 * Math.PI * ringR;
  if (state.isPending) return <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}><div className="text-center"><div className="mx-auto h-14 w-14 rounded-2xl bg-green-700 text-white flex items-center justify-center animate-pulse"><Mic size={26} /></div><p className="mt-3 font-semibold">BoloSam load ho raha hai…</p></div></div>;
  if (state.error) return <div className="min-h-screen p-6 text-center" style={{ background: "var(--bg)" }}><p>Data load nahi hua.</p><button onClick={() => state.refetch()} className="mt-3 rounded-full bg-green-800 px-5 py-2 text-white font-bold btn-press">Dobara try karo</button></div>;

  return (
    <div className="min-h-screen w-full overflow-x-clip" style={{ background: "var(--bg-grad)", color: "var(--text)" }}>
      
      <main className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-5">
        {/* MENU BAR — sticky; hamburger + dropdown panel on mobile, chip row on larger screens */}
        <header className="sticky top-0 z-50 -mx-4 px-4 sm:-mx-5 sm:px-5" style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 py-2.5">
            <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-controls="mobile-menu-panel" aria-label={menuOpen ? "Menu band karo" : "Menu kholo"} className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold text-white btn-press sm:hidden" style={{ background: "var(--accent)", boxShadow: "0 6px 16px rgba(22,101,52,.25)" }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />} Menu
            </button>
            <span className="min-w-0 flex-1 truncate text-sm font-bold sm:hidden" style={{ color: "var(--dim)" }} aria-live="polite">{NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? "Dashboard"}</span>
            <span className="hidden shrink-0 items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest sm:inline-flex" style={{ color: "var(--dim)" }}><Menu size={14} /> Menu</span>
            <nav aria-label="Sections menu" className="hidden min-w-0 flex-1 sm:block">
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-0.5">
                {NAV_ITEMS.map(({ id, label, Icon }) => (
                  <button key={id} type="button" onClick={() => goToSection(id)} aria-current={activeNav === id ? "true" : undefined} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-bold btn-press" style={{ background: activeNav === id ? "var(--accent)" : "var(--surface)", color: activeNav === id ? "#fff" : "var(--text)", border: "1px solid var(--border)", boxShadow: activeNav === id ? "0 6px 16px rgba(22,101,52,.25)" : "none" }}><Icon size={15} /> {label}</button>
                ))}
              </div>
            </nav>
          </div>
          {menuOpen && (
            <nav id="mobile-menu-panel" aria-label="Sections menu" className="animate-fade-up pb-3 sm:hidden">
              <ul className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map(({ id, label, Icon }) => (
                  <li key={id}>
                    <button type="button" onClick={() => goToSection(id)} aria-current={activeNav === id ? "true" : undefined} className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left text-sm font-bold btn-press" style={{ background: activeNav === id ? "var(--accent)" : "var(--surface)", color: activeNav === id ? "#fff" : "var(--text)", border: "1px solid var(--border)", boxShadow: activeNav === id ? "0 6px 16px rgba(22,101,52,.25)" : "var(--shadow-sm)" }}><Icon size={17} className="shrink-0" /> <span className="truncate">{label}</span>{activeNav === id && <CheckCircle2 size={15} className="ml-auto shrink-0" />}</button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>
        {/* HERO */}
        <div className="pt-4 animate-fade-up">
          <div className="relative overflow-hidden rounded-[28px] text-white shadow-xl" style={{ background: "linear-gradient(135deg,#14532D 0%,#166534 55%,#15803D 100%)", boxShadow: "var(--shadow-lg)" }}>
            <div className="hero-pattern absolute inset-0 opacity-60" />
            <div className="relative p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase"><Sparkles size={13} /> Voice-First Khata</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-stone-900 px-3 py-1.5 text-[11px] font-extrabold"><span className="h-2 w-2 rounded-full bg-green-700 animate-pulse" /> LIVE</span>
              </div>
              <h1 className="font-display text-[32px] leading-[36px] sm:text-4xl font-extrabold mt-4 flex items-center gap-2.5">Bolo, Hisab Ho Gaya! <span className="icon-tile h-10 w-10 bg-white text-green-800 rounded-2xl shadow"><Mic size={20} /></span></h1>
              <p className="text-[15px] leading-6 text-green-50/90 mt-2 max-w-lg">3 second bolo — Bikri, Kharcha, Yaad aur Munafa, bina type kiye. Hindi, English ya Hinglish.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5"><Zap size={13} /> &lt;5 sec entry</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5"><Languages size={13} /> Hindi + English</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5"><CircleDollarSign size={13} /> No typing needed</span>
              </div>
            </div>
          </div>
          {hasDemo && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-3.5 py-2.5 text-amber-900">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wide"><TriangleAlert size={15} /> DEMO DATA — sample kirana entries</span>
              <button onClick={() => clearDemo.mutate()} className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white btn-press" aria-label="Clear demo data"><Trash2 size={13} /> Demo clear karo</button>
            </div>
          )}
        </div>

        {/* DASHBOARD */}
        <section id="dashboard" aria-label="Dashboard" className="mt-5 scroll-mt-20 animate-fade-up">
          <div className="flex items-center gap-2 mb-3 px-1"><ListFilter size={16} style={{ color: "var(--dim)" }} /><span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: "var(--dim)" }}>Period chuno</span></div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto p-1.5 rounded-full sm:gap-2" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }} role="group" aria-label="Period filter">
            {([["today", "Aaj · Today"], ["month", "Mahina · Month"], ["all", "Sab · All Time"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setPeriod(k)} aria-pressed={period === k} className="min-w-0 flex-1 shrink-0 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-bold btn-press sm:text-sm" style={{ background: period === k ? "var(--accent)" : "transparent", color: period === k ? "#fff" : "var(--text)", boxShadow: period === k ? "0 6px 16px rgba(22,101,52,.25)" : "none" }}>{label}</button>
            ))}
          </div>

          <div className="mt-3 relative overflow-hidden rounded-[28px] p-5 sm:p-6 text-white" style={{ background: net >= 0 ? "linear-gradient(135deg,#052E16,#14532D 55%,#166534)" : "linear-gradient(135deg,#450A0A,#7F1D1D 55%,#991B1B)", boxShadow: "var(--shadow-md)" }}>
            <div className="hero-pattern absolute inset-0 opacity-50" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold opacity-90"><Wallet size={16} /> Munafa · Net Balance</p>
                <p className="font-display text-[44px] leading-[48px] sm:text-5xl font-extrabold mt-1 tracking-tight">{net < 0 ? "−" : ""}{inr(net)}</p>
                <p className="text-xs opacity-80 mt-1 inline-flex items-center gap-1.5"><CalendarDays size={13} /> {period === "today" ? "Aaj ka hisab" : period === "month" ? "Is mahine ka hisab" : "Kul hisab · All time"}</p>
              </div>
              <div className="icon-tile h-12 w-12 rounded-2xl bg-white/15 backdrop-blur shrink-0">{net >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}</div>
            </div>
            <div className="relative mt-4 h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${salesTotal + expTotal ? Math.round((salesTotal / (salesTotal + expTotal)) * 100) : 0}%` }} /></div>
            <p className="relative text-[11px] mt-1.5 opacity-80">Bikri ka hissa kul flow mein {salesTotal + expTotal ? Math.round((salesTotal / (salesTotal + expTotal)) * 100) : 0}%</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="card card-hover p-4 sm:p-5 overflow-hidden relative">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-green-100" />
              <div className="relative"><div className="flex items-center justify-between"><span className="icon-tile h-10 w-10 bg-green-600 text-white shadow-md shadow-green-600/25"><ArrowUpRight size={19} /></span><span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{filteredByPeriod.filter((t) => t.type === "sale").length} entries</span></div>
              <p className="text-[13px] font-bold mt-3" style={{ color: "var(--dim)" }}>Bikri · Sales</p><p className="font-display break-all text-[22px] leading-7 font-extrabold text-green-700 mt-0.5 sm:text-[28px] sm:leading-8">{inr(salesTotal)}</p></div>
            </div>
            <div className="card card-hover p-4 sm:p-5 overflow-hidden relative">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-red-100" />
              <div className="relative"><div className="flex items-center justify-between"><span className="icon-tile h-10 w-10 bg-red-600 text-white shadow-md shadow-red-600/25"><ArrowDownRight size={19} /></span><span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">{filteredByPeriod.filter((t) => t.type === "expense").length} entries</span></div>
              <p className="text-[13px] font-bold mt-3" style={{ color: "var(--dim)" }}>Kharcha · Expenses</p><p className="font-display break-all text-[22px] leading-7 font-extrabold text-red-600 mt-0.5 sm:text-[28px] sm:leading-8">{inr(expTotal)}</p></div>
            </div>
          </div>
        </section>

        {/* VOICE STUDIO */}
        <section id="voice" aria-label="Voice AI Studio" className="mt-6 scroll-mt-20 card p-5 sm:p-6 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 via-amber-400 to-green-600" />
          <SectionHead icon={<Mic size={20} />} title="Voice AI Studio" sub="Bolo aur Hisab Karo — Hindi, English ya Hinglish mein bolo. BoloSam sunega, samjhega aur bolkar jawab dega." color="#166534" bg="#DCFCE7" />
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold"><Languages size={16} /> Bhasha:</span>
            <div className="flex gap-1 p-1 rounded-full" style={{ background: "var(--surface2)" }}>
              {([["hi-IN", "हिंदी"], ["en-IN", "English"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setLang(v)} aria-pressed={lang === v} className="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold btn-press" style={{ background: lang === v ? "#fff" : "transparent", color: "#1C1917", boxShadow: lang === v ? "0 2px 8px rgba(0,0,0,.12)" : "none" }}>{l} <span className="opacity-60 text-[11px]">{v}</span></button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full ${listening ? "animate-ping bg-red-400/30" : "bg-green-100"}`} style={{ transform: "scale(1.18)" }} />
              <button onClick={() => void startListening()} aria-label={listening ? "Listening, tap to stop" : "Tap microphone and speak"} aria-pressed={listening} className={`relative flex h-28 w-28 flex-col items-center justify-center rounded-full text-white shadow-2xl btn-press ${listening ? "listening bg-gradient-to-br from-red-500 to-red-700" : "bg-gradient-to-br from-green-600 to-green-800 shadow-green-800/30"}`}>
                <Mic size={42} strokeWidth={2} />
                {listening && <span className="flex items-end gap-1 h-4 mt-1"><span className="wave-bar" style={{ height: 14, animationDelay: "0s" }} /><span className="wave-bar" style={{ height: 18, animationDelay: ".15s" }} /><span className="wave-bar" style={{ height: 12, animationDelay: ".3s" }} /><span className="wave-bar" style={{ height: 16, animationDelay: ".45s" }} /></span>}
              </button>
            </div>
            <p className="mt-3 text-[15px] font-extrabold">{listening ? "Sun raha hoon… bolo!" : "Mic dabao aur bolo"}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--dim)" }}>{listening ? "Band karne ke liye mic dobara dabao" : "Ek tap · 3 second · entry ready"}</p>
            {listening && interim && <p className="mt-3 text-sm font-semibold rounded-2xl px-4 py-2.5 text-center max-w-md" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} aria-live="polite">Sun raha hoon: “{interim}”</p>}
            {voiceError && (
              <div role="alert" className="mt-3 max-w-md w-full rounded-2xl px-4 py-3 text-center" style={voiceErrorKind === "info" ? { background: "#FFFBEB", border: "1px solid #F59E0B", color: "#92400E" } : { background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
                <p className="text-sm font-semibold leading-5">{voiceError}</p>
                <div className="mt-2.5 flex justify-center gap-2 flex-wrap">
                  <button onClick={() => void startListening()} className="inline-flex items-center gap-1.5 rounded-full bg-green-700 px-3.5 py-1.5 text-xs font-bold text-white btn-press" aria-label="Retry microphone"><Mic size={13} /> Dobara try karo</button>
                  <button onClick={focusTypedInput} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold btn-press" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} aria-label="Type command instead">Type karke karo</button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="typed-cmd" className="text-sm font-bold">Ya yahan type karo</label>
            <div className="mt-1.5 flex gap-2">
              <input id="typed-cmd" value={typedCmd} onChange={(e) => setTypedCmd(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && typedCmd.trim()) { handleCommand(typedCmd); setTypedCmd(""); } }} placeholder="e.g. 500 rupaye ki bikri hui" className="flex-1 rounded-2xl px-4 py-3 text-base min-w-0" style={{ border: "1.5px solid var(--border)", background: "var(--bg)" }} />
              <button onClick={() => { if (typedCmd.trim()) { handleCommand(typedCmd); setTypedCmd(""); } }} className="inline-flex items-center gap-1.5 rounded-2xl bg-green-700 hover:bg-green-800 px-4 sm:px-5 py-3 font-bold text-white shadow-md shadow-green-700/20 btn-press shrink-0" aria-label="Run typed command">Bolo <Send size={16} /></button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Example commands">
            {examples.map((ex) => (
              <button key={ex.cmd} onClick={() => handleCommand(ex.cmd)} className="inline-flex items-center gap-2 rounded-full pl-3 pr-3.5 py-2 text-left text-[13px] font-semibold btn-press hover:shadow" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}><span className="text-green-800">{ex.icon}</span>{ex.label}</button>
            ))}
          </div>

          {(transcript || parsedInfo || lastReply) && (
            <div className="mt-4 space-y-2.5 rounded-3xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} aria-live="polite">
              {transcript && <p className="flex gap-2.5 text-sm"><span className="icon-tile h-7 w-7 bg-blue-100 text-blue-700 shrink-0"><Ear size={14} /></span><span><strong>Suna gaya:</strong> “{transcript}”</span></p>}
              {parsedInfo && <p className="flex gap-2.5 text-sm"><span className="icon-tile h-7 w-7 bg-amber-100 text-amber-700 shrink-0"><Brain size={14} /></span><span><strong>Samjha:</strong> {parsedInfo}</span></p>}
              {lastReply && <div className="flex gap-2.5 text-sm"><span className="icon-tile h-7 w-7 bg-green-100 text-green-700 shrink-0"><Volume2 size={14} /></span><p className="flex-1"><strong>BoloSam bola:</strong> {lastReply}</p><button onClick={() => speak(lastReply, lang)} className="inline-flex items-center gap-1 rounded-full bg-green-700 px-3 py-1.5 text-xs font-bold text-white shrink-0 btn-press h-fit" aria-label="Replay spoken reply"><Play size={12} /> Dobara suno</button></div>}
            </div>
          )}
        </section>

        {/* LEDGER */}
        <section id="khata" aria-label="Transaction ledger" className="mt-7 scroll-mt-20">
          <SectionHead icon={<NotebookText size={20} />} title="Khata · Ledger" sub="Saari entries — search karo, manual jodo ya delete karo." color="#92400E" bg="#FEF3C7" />
          <div className="relative mt-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--dim)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search karo — title, category, date, amount…" aria-label="Search ledger" className="w-full rounded-2xl pl-11 pr-4 py-3.5 shadow-sm" style={{ border: "1px solid var(--border)", background: "var(--surface)" }} />
          </div>

          <form className="mt-3 card p-4 sm:p-5" onSubmit={(e) => { e.preventDefault(); setMError(""); const amt = parseInt(mAmount, 10); if (!mTitle.trim()) { setMError("Title likho — e.g. Chai"); return; } if (!amt || amt <= 0) { setMError("Sahi amount likho (₹)"); return; } addTxn.mutate({ type: mType, title: mTitle.trim(), amount: amt, category: mCat, txn_date: mDate }, { onSuccess: () => { setMTitle(""); setMAmount(""); } }); }}>
            <p className="font-bold text-sm inline-flex items-center gap-2"><Plus size={16} className="text-green-700" /> Manual entry jodo</p>
            <div className="mt-3 grid grid-cols-2 gap-2 p-1 rounded-2xl" style={{ background: "var(--bg)" }}>
              <button type="button" onClick={() => setMType("sale")} aria-pressed={mType === "sale"} className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold text-white btn-press" style={{ background: mType === "sale" ? "#16A34A" : "transparent", color: mType === "sale" ? "#fff" : "var(--dim)", boxShadow: mType === "sale" ? "0 6px 14px rgba(22,163,74,.25)" : "none" }}><TrendingUp size={16} /> Bikri</button>
              <button type="button" onClick={() => setMType("expense")} aria-pressed={mType === "expense"} className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold btn-press" style={{ background: mType === "expense" ? "#DC2626" : "transparent", color: mType === "expense" ? "#fff" : "var(--dim)", boxShadow: mType === "expense" ? "0 6px 14px rgba(220,38,38,.25)" : "none" }}><TrendingDown size={16} /> Kharcha</button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="m-title" className="text-xs font-bold">Title</label><input id="m-title" value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Atta stock liya" className="mt-1 w-full rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }} /></div>
              <div><label htmlFor="m-amt" className="text-xs font-bold inline-flex items-center gap-1"><IndianRupee size={12} /> Amount</label><input id="m-amt" inputMode="numeric" value={mAmount} onChange={(e) => setMAmount(e.target.value)} placeholder="500" className="mt-1 w-full rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }} /></div>
              <div><label htmlFor="m-cat" className="text-xs font-bold">Category</label><select id="m-cat" value={mCat} onChange={(e) => setMCat(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label htmlFor="m-date" className="text-xs font-bold">Date</label><input id="m-date" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="mt-1 w-full rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }} /></div>
            </div>
            {mError && <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1.5"><TriangleAlert size={15} />{mError}</p>}
            <button type="submit" className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 py-3.5 font-bold text-white shadow-md shadow-green-700/20 btn-press"><CheckCircle2 size={18} /> Entry Save Karo</button>
          </form>

          <ul className="mt-3 space-y-2">
            {searched.length === 0 && <li className="card p-5 text-center text-sm" style={{ color: "var(--dim)" }}><NotebookText size={28} className="mx-auto mb-2 opacity-40" />Koi entry nahi mili. Voice ya manual entry se pehli entry jodo.</li>}
            {searched.map((t) => (
              <li key={t.id} className="card card-hover flex items-center gap-3 p-3.5">
                <span className="icon-tile h-11 w-11 text-white shadow" style={{ background: CAT_COLORS[t.category] ?? (t.type === "sale" ? "#16A34A" : "#DC2626") }}><CatIcon cat={t.category} size={19} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-sm flex items-center gap-2">{t.title} {t.is_demo && <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900 tracking-wide shrink-0">DEMO</span>}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--dim)" }}><span>{t.category}</span><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><CalendarDays size={11} />{t.txn_date}</span><span className={`inline-flex items-center gap-0.5 font-bold ${t.type === "sale" ? "text-green-700" : "text-red-600"}`}>{t.type === "sale" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{t.type === "sale" ? "Bikri" : "Kharcha"}</span></p>
                </div>
                <span className="font-display text-lg font-extrabold shrink-0" style={{ color: t.type === "sale" ? "#16A34A" : "#DC2626" }}>{t.type === "sale" ? "+" : "−"}{inr(t.amount)}</span>
                <button onClick={() => delTxn.mutate(t.id)} aria-label={`Delete entry ${t.title}`} className="icon-tile h-9 w-9 rounded-full bg-red-50 text-red-600 btn-press shrink-0"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        </section>

        {/* ANALYTICS */}
        <section id="report" aria-label="Category analytics" className="mt-7 scroll-mt-20 card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <SectionHead icon={<ChartPie size={20} />} title="Report · Analytics" sub={`${period === "today" ? "Aaj" : period === "month" ? "Is mahine" : "All time"} ka category breakdown`} color="#7C3AED" bg="#EDE9FE" />
            <div className="flex gap-1 p-1 rounded-full" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <button onClick={() => setAnalyticsType("expense")} aria-pressed={analyticsType === "expense"} className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold text-white btn-press" style={{ background: analyticsType === "expense" ? "#DC2626" : "transparent", color: analyticsType === "expense" ? "#fff" : "var(--dim)" }}>Kharcha</button>
              <button onClick={() => setAnalyticsType("sale")} aria-pressed={analyticsType === "sale"} className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold btn-press" style={{ background: analyticsType === "sale" ? "#16A34A" : "transparent", color: analyticsType === "sale" ? "#fff" : "var(--dim)" }}>Bikri</button>
            </div>
          </div>
          <div className="mt-4"><Donut data={donutData} /></div>
        </section>

        {/* BUDGET + REMINDERS */}
        <section id="budget" aria-label="Budget and reminders" className="mt-6 grid w-full min-w-0 grid-cols-1 gap-4 scroll-mt-20 items-start md:grid-cols-2">
          <div className="card min-w-0 p-5 sm:p-6">
            <SectionHead icon={<Target size={20} />} title="Mahine ka Budget" sub="Kharcha control mein rakho" color="#166534" bg="#DCFCE7" />
            <div className={`mt-4 flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-sm font-bold ${overBudget ? "bg-red-50 text-red-800 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
              {overBudget ? <TriangleAlert size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
              <span>{overBudget ? `Budget khatam! ${inr(monthExp - budgetLimit)} zyada kharcha ho gaya.` : `Budget mein ho! ${inr(Math.max(0, budgetLimit - monthExp))} bacha hai.`}</span>
            </div>
            <div className="mt-4 flex justify-center relative">
              <svg viewBox="0 0 140 140" className="h-44 w-44 -rotate-90" role="img" aria-label={`Budget used ${budgetPct} percent`}>
                <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--border)" strokeWidth="12" />
                <circle cx="70" cy="70" r={ringR} fill="none" stroke={overBudget ? "#DC2626" : "#166534"} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(budgetPct / 100) * ringC} ${ringC}`} />
                <text x="70" y="64" textAnchor="middle" transform="rotate(90 70 70)" className="font-display" fontSize="22" fontWeight="800" fill="var(--text)">{budgetPct}%</text>
                <text x="70" y="82" textAnchor="middle" transform="rotate(90 70 70)" fontSize="10" fill="var(--dim)">kharcha hua</text>
              </svg>
            </div>
            <p className="text-center text-sm">Is mahine kharcha: <strong>{inr(monthExp)}</strong> <span style={{ color: "var(--dim)" }}>/ {inr(budgetLimit)}</span></p>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}><div className="h-full rounded-full transition-all" style={{ width: `${budgetPct}%`, background: overBudget ? "#DC2626" : "#16A34A" }} /></div>
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setBudgetError(""); const v = parseInt(budgetInput, 10); if (!v || v < 100) { setBudgetError("Kam se kam ₹100 ka budget rakho"); return; } setBudgetMut.mutate(v, { onSuccess: () => setBudgetInput("") }); }}>
              <div className="flex-1 min-w-0"><label htmlFor="budget-in" className="sr-only">Monthly budget limit in rupees</label><input id="budget-in" inputMode="numeric" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder={`Budget badlo — abhi ${inr(budgetLimit)}`} className="w-full rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }} /></div>
              <button type="submit" className="rounded-xl bg-green-700 px-5 font-bold text-white btn-press shrink-0">Set</button>
            </form>
            {budgetError && <p className="mt-1.5 text-sm text-red-600 font-semibold">{budgetError}</p>}
          </div>

          <div id="yaad" className="card min-w-0 scroll-mt-20 p-5 sm:p-6">
            <SectionHead icon={<Bell size={20} />} title="Yaad · Reminders" sub="Call, payment aur follow-up — kuch bhoolo mat" color="#92400E" bg="#FEF3C7" />
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); setRError(""); if (!rTitle.trim()) { setRError("Reminder likho — e.g. Sharma ji ko call"); return; } addRem.mutate({ title: rTitle.trim(), due_label: rDue.trim() }, { onSuccess: () => { setRTitle(""); setRDue(""); } }); }}>
              <div><label htmlFor="r-title" className="text-xs font-bold">Reminder</label><input id="r-title" value={rTitle} onChange={(e) => setRTitle(e.target.value)} placeholder="Sharma ji ko call karna hai" className="mt-1 w-full rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }} /></div>
              <div><label htmlFor="r-due" className="text-xs font-bold">Kab? (Due)</label><input id="r-due" value={rDue} onChange={(e) => setRDue(e.target.value)} placeholder="Kal 10 baje" className="mt-1 w-full rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }} /></div>
              {rError && <p className="text-sm text-red-600 font-semibold">{rError}</p>}
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 font-extrabold text-stone-900 shadow-md shadow-amber-500/25 btn-press"><Plus size={18} /> Reminder Jodo</button>
            </form>
            <button onClick={ringSound} className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 font-bold btn-press" style={{ border: "2px solid var(--accent2)", color: "var(--text)", background: "var(--surface2)" }} aria-label="Test reminder ring sound"><BellRing size={18} className="text-amber-600" /> Ring Test Karo</button>
            <ul className="mt-3 space-y-2">
              {reminders.length === 0 && <li className="text-sm text-center py-4 rounded-2xl" style={{ color: "var(--dim)", background: "var(--bg)" }}>Koi reminder nahi. Voice se bolo: “Kal 10 baje call reminder”</li>}
              {reminders.map((r) => (
                <li key={r.id} className="flex min-w-0 items-center gap-2.5 rounded-2xl p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={r.done} onChange={(e) => toggleRem.mutate({ id: r.id, done: e.target.checked })} aria-label={`Mark reminder done: ${r.title}`} className="h-5 w-5 shrink-0 accent-green-700" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${r.done ? "line-through opacity-50" : ""}`}>{r.title}</p>
                    {r.due_label && <p className="text-xs inline-flex items-center gap-1 mt-0.5" style={{ color: "var(--dim)" }}><Clock3 size={12} /> {r.due_label}</p>}
                  </div>
                  <button onClick={ringSound} aria-label={`Ring test for ${r.title}`} className="icon-tile h-8 w-8 rounded-full bg-amber-100 text-amber-700 btn-press shrink-0"><Bell size={15} /></button>
                  <button onClick={() => delRem.mutate(r.id)} aria-label={`Delete reminder ${r.title}`} className="icon-tile h-8 w-8 rounded-full bg-red-50 text-red-600 btn-press shrink-0"><X size={16} /></button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CALCULATOR */}
        <section id="calculator" aria-label="Bolta Calculator" className="mt-6 scroll-mt-20 rounded-[28px] p-5 sm:p-6 overflow-hidden relative" style={{ background: "linear-gradient(160deg,#1C1917,#292524)", color: "#FAFAF9", boxShadow: "var(--shadow-md)" }}>
          <div className="flex items-start gap-3">
            <div className="icon-tile h-11 w-11 bg-amber-500 text-stone-900"><Calculator size={20} /></div>
            <div><h2 className="font-display text-[22px] leading-6 font-extrabold">Bolta Calculator</h2><p className="text-sm opacity-75 mt-0.5">Hisab karo — total bolkar sunayega, ek tap mein Bikri / Kharcha ban jayega.</p></div>
          </div>
          <div className="mt-4 rounded-3xl bg-black/60 border border-white/10 px-5 py-4 text-right">
            {calcExpr && <p className="text-xs opacity-50 truncate">{calcExpr}</p>}
            <p className="font-display text-[40px] leading-[44px] font-extrabold break-all tracking-tight" aria-live="polite">{calcDisplay}</p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {["C", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "%", "+", "="].map((k) => (
              k === "=" ? <button key={k} onClick={() => calcPress("=")} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 font-display text-lg font-extrabold text-stone-900 shadow-lg shadow-amber-500/20 btn-press" aria-label="Equals"><Volume2 size={18} /> = Bolkar Batao</button>
              : <button key={k} onClick={() => calcPress(k === "÷" ? "/" : k === "×" ? "*" : k)} className={`rounded-2xl py-3.5 font-display text-xl font-bold btn-press ${k === "C" ? "bg-red-500/90 text-white" : "+-×÷%".includes(k) ? "bg-stone-600 text-amber-300" : "bg-stone-700/90 hover:bg-stone-600"}`} aria-label={`Calculator key ${k}`}>{k}</button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => calcToEntry("sale")} className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-green-600 py-3.5 font-bold btn-press text-sm sm:text-base"><ArrowUpRight size={17} /> Bikri Mein Jodo {calcResult ? `(${inr(Math.round(calcResult))})` : ""}</button>
            <button onClick={() => calcToEntry("expense")} className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3.5 font-bold btn-press text-sm sm:text-base"><ArrowDownRight size={17} /> Kharcha Mein Jodo {calcResult ? `(${inr(Math.round(calcResult))})` : ""}</button>
          </div>
          <button onClick={() => { if (calcResult != null) speak(`Total hai ${calcResult} rupaye.`, lang); }} className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/10 py-3 font-bold btn-press" aria-label="Speak calculator result"><Volume2 size={17} /> Result Suno</button>
        </section>

        {/* ABOUT */}
        <section id="about" aria-label="About BoloSam" className="mt-6 scroll-mt-20 card p-5 sm:p-6">
          <SectionHead icon={<Info size={20} />} title="BoloSam — Kaise Kaam Karta Hai?" sub="63 million micro-merchants ke liye bana voice khata" color="#1D4ED8" bg="#DBEAFE" />
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p><strong>Problem:</strong> Bharat ke 63 million micro-merchants — kirana dukaan, thela, chai stall, tailor aur gig workers — aaj bhi kagaz ki copy ya yaad par hisab rakhte hain. English-only apps, lambe forms aur type karne ki dikkat ki wajah se chhote kharche (chai, bhada, doodh) likhe hi nahi jaate, aur asal Munafa galat nikalta hai.</p>
            <p><strong>Hal:</strong> Sirf 3 second bolo — Hindi, English ya Hinglish — aur BoloSam use Bikri, Kharcha, Yaad (reminder) ya hisab mein badal deta hai. Koi typing nahi, koi API key nahi, koi accounting training nahi. Sab kuch browser ke Web Speech API (hi-IN / en-IN) se chalta hai.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Store size={20} />, bg: "#DCFCE7", c: "#166534", t: "Kirana & Retail", d: "Roz 40–100 chhote cash/UPI transactions, haath vyast — voice se 5 second mein entry." },
              { icon: <Coffee size={20} />, bg: "#FEF3C7", c: "#92400E", t: "Vendors, Tailors & Tea Stalls", d: "Hinglish mein sahaj — “500 ki bikri hui” bolo, bade cards mein hisab dekho." },
              { icon: <Bike size={20} />, bg: "#DBEAFE", c: "#1D4ED8", t: "Gig Workers & Households", d: "Petrol, khana aur mahine ka budget — budget alert aur bole gaye reminders." },
            ].map((p) => (
              <div key={p.t} className="rounded-3xl p-4 card-hover" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <span className="icon-tile h-10 w-10" style={{ background: p.bg, color: p.c }}>{p.icon}</span>
                <p className="font-bold mt-2.5 text-[15px]">{p.t}</p><p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--dim)" }}>{p.d}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-5 font-extrabold flex items-center gap-2"><Landmark size={17} className="text-green-700" /> Phase 1 Pilot — Success Metrics <span className="text-xs font-semibold" style={{ color: "var(--dim)" }}>(Weeks 1–4, 50 kirana stores)</span></h3>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-3xl bg-green-700 p-4 text-white shadow-md shadow-green-700/20"><p className="font-display text-2xl font-extrabold">&lt;5 sec</p><p className="text-[11px] opacity-90 mt-0.5">Voice entry time</p></div>
            <div className="rounded-3xl bg-amber-500 p-4 text-stone-900 shadow-md shadow-amber-500/20"><p className="font-display text-2xl font-extrabold">≥90%</p><p className="text-[11px] font-semibold mt-0.5">Command accuracy</p></div>
            <div className="rounded-3xl bg-stone-900 p-4 text-white shadow-md"><p className="font-display text-2xl font-extrabold">≥60%</p><p className="text-[11px] opacity-90 mt-0.5">Daily active retention</p></div>
          </div>
          <ol className="mt-5 space-y-2.5 text-sm" style={{ color: "var(--dim)" }}>
            {["Mic dabao ya example chip chuno — bolo: “500 rupaye ki bikri hui”.", "BoloSam amount, category aur matlab samajhkar entry jodta hai aur bolkar confirm karta hai.", "Dashboard mein Munafa, donut report aur budget ring turant update hote hain.", "“Aaj ka hisab batao” bolkar poora din ka hisab suno."].map((step, i) => (
              <li key={step} className="flex gap-3"><span className="icon-tile h-6 w-6 rounded-full bg-green-700 text-white text-xs font-extrabold shrink-0 mt-0.5">{i + 1}</span><span className="leading-relaxed">{step}</span></li>
            ))}
          </ol>
          <p className="mt-4 pt-4 flex items-center gap-2 text-xs" style={{ color: "var(--dim)", borderTop: "1px solid var(--border)" }}><Users size={14} /> Theme: Livelihoods & Small Business · v1.0 Pilot Release · Mobile-First Web App <ChevronRight size={13} /></p>
        </section>
      </main>
    </div>
  );
}
