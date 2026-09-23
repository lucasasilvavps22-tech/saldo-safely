import { useMemo, useState } from "react";
import { CreditCard, LayoutDashboard, MessageCircle, PiggyBank, Receipt, Tags, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { budgets, cards, monthly, transactions } from "./data";

const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
type View="dashboard"|"transactions"|"budgets"|"cards"|"categories"|"assistant";

export default function App(){
 const [view,setView]=useState<View>("dashboard");
 const [selectedCategory,setSelectedCategory]=useState<string|null>(null);
 const expenses=transactions.filter(t=>t.type==="expense");
 const totalExpenses=expenses.reduce((s,t)=>s+t.amount,0);
 const totalIncome=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
 const totalInvestment=transactions.filter(t=>t.type==="investment").reduce((s,t)=>s+t.amount,0);
 const categoryData=useMemo(()=>{const m=new Map<string,number>();expenses.forEach(t=>m.set(t.category,(m.get(t.category)||0)+t.amount));return [...m.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)},[]);
 const selected=selectedCategory?expenses.filter(t=>t.category===selectedCategory):[];
 const nav=[["dashboard","Dashboard",LayoutDashboard],["transactions","Transações",Receipt],["budgets","Orçamentos",PiggyBank],["cards","Cartões e Contas",CreditCard],["categories","Categorias",Tags],["assistant","Assistente WhatsApp",MessageCircle]] as const;
 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand"><WalletCards size={24}/><div><strong>saldo safely</strong><span>finanças pessoais</span></div></div>
   <nav>{nav.map(([id,label,Icon])=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><Icon size={18}/><span>{label}</span></button>)}</nav>
   <div className="sidebar-note">Ambiente independente do CoreFlow</div>
  </aside>
  <main className="content">
   <header className="topbar"><div><h1>{nav.find(n=>n[0]===view)?.[1]}</h1><p>Setembro de 2026</p></div><button className="primary">+ Novo lançamento</button></header>
   {view==="dashboard"&&<>
    <section className="kpi-grid">
     <Kpi label="Receitas" value={money(totalIncome)} helper="mês atual"/><Kpi label="Despesas" value={money(totalExpenses)} helper="mês atual"/><Kpi label="Saldo do mês" value={money(totalIncome-totalExpenses-totalInvestment)} helper="após aportes"/><Kpi label="Reserva / aportes" value={money(totalInvestment)} helper="meta mensal"/><Kpi label="Fatura atual" value={money(cards[0].currentBill)} helper="Bradesco"/><Kpi label="Disponível estimado" value={money(Math.max(0,totalIncome-totalExpenses-totalInvestment))} helper="até o fim do mês"/>
    </section>
    <section className="two-col">
     <Panel title="Despesas por categoria" subtitle="Clique em uma barra para detalhar"><div className="chart"><ResponsiveContainer width="100%" height={280}><BarChart data={categoryData} layout="vertical" onClick={(s:any)=>s?.activeLabel&&setSelectedCategory(s.activeLabel)}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number"/><YAxis type="category" dataKey="name" width={90}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="value" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></Panel>
     <Panel title="Evolução financeira" subtitle="Receitas, despesas e aportes"><div className="chart"><ResponsiveContainer width="100%" height={280}><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={(v:any)=>money(Number(v))}/><Legend/><Line dataKey="income" name="Receitas" strokeWidth={2}/><Line dataKey="expense" name="Despesas" strokeWidth={2}/><Line dataKey="investment" name="Aportes" strokeWidth={2}/></LineChart></ResponsiveContainer></div></Panel>
    </section>
    <section className="two-col">
     <Panel title="Orçamentos do mês"><div className="budget-list">{budgets.map(b=>{const pct=Math.round((b.actual/b.planned)*100);return <div key={b.category} className="budget-row"><div><strong>{b.category}</strong><span>{money(b.actual)} de {money(b.planned)}</span></div><div className="progress"><i style={{width:Math.min(pct,100)+"%"}}/></div><b className={pct>=100?"danger":pct>=80?"warn":""}>{pct}%</b></div>})}</div></Panel>
     <Panel title="Transações recentes"><TransactionsTable limit={7}/></Panel>
    </section>
   </>}
   {view==="transactions"&&<Panel title="Todas as transações" subtitle="Base pronta para filtros, edição e integração com WhatsApp"><TransactionsTable/></Panel>}
   {view==="budgets"&&<div className="grid-cards">{budgets.map(b=><div className="simple-card" key={b.category}><h3>{b.category}</h3><strong>{money(b.actual)}</strong><span>de {money(b.planned)}</span><div className="progress"><i style={{width:Math.min((b.actual/b.planned)*100,100)+"%"}}/></div></div>)}</div>}
   {view==="cards"&&<div className="grid-cards">{cards.map(c=><div className="simple-card" key={c.name}><h3>{c.name}</h3><strong>{money(c.currentBill)}</strong><span>Fatura atual</span><p>Limite: {money(c.limit)}</p><p>Fecha dia {c.closingDay} · vence dia {c.dueDay}</p></div>)}</div>}
   {view==="categories"&&<div className="grid-cards">{[...new Set(expenses.map(t=>t.category))].map(c=><div className="simple-card" key={c}><h3>{c}</h3><span>{transactions.filter(t=>t.category===c).length} lançamento(s)</span></div>)}</div>}
   {view==="assistant"&&<Assistant/>}
   {selectedCategory&&<div className="drawer-backdrop" onClick={()=>setSelectedCategory(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><h2>{selectedCategory}</h2><p>{selected.length} lançamento(s)</p></div><button onClick={()=>setSelectedCategory(null)}>×</button></div>{selected.map(t=><div className="drawer-item" key={t.id}><div><strong>{t.description}</strong><span>{t.subcategory||"Sem subcategoria"} · {t.account}</span></div><b>{money(t.amount)}</b></div>)}</aside></div>}
  </main>
 </div>
}
function Kpi(p:{label:string,value:string,helper:string}){return <div className="kpi"><span>{p.label}</span><strong>{p.value}</strong><small>{p.helper}</small></div>}
function Panel(p:{title:string,subtitle?:string,children:any}){return <section className="card"><div className="card-head"><h2>{p.title}</h2>{p.subtitle&&<p>{p.subtitle}</p>}</div>{p.children}</section>}
function TransactionsTable({limit}:{limit?:number}){const rows=limit?transactions.slice(0,limit):transactions;return <div className="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Origem</th><th>Valor</th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td>{new Date(t.date+"T00:00:00").toLocaleDateString("pt-BR")}</td><td>{t.description}</td><td>{t.category}</td><td>{t.account}</td><td>{t.source}</td><td>{money(t.amount)}</td></tr>)}</tbody></table></div>}
function Assistant(){const examples=["Gastei 42,90 no almoço hoje","Recebi 10.300 de salário","180 reais de gasolina no cartão","Comprei uma camisa por 230 em 3x","Quanto gastei com restaurantes este mês?","Apaga o último lançamento"];return <div className="assistant-grid"><Panel title="Assistente WhatsApp" subtitle="Demonstração do fluxo que será ligado à API oficial"><div className="chat-demo">{examples.map((e,i)=><div className="bubble user" key={i}>{e}</div>)}</div></Panel><Panel title="Confirmação de mensagem ambígua"><div className="confirm-box"><p>“Paguei 350”</p><strong>Como você quer registrar?</strong><button>Despesa</button><button>Transferência</button><button>Outro</button></div></Panel></div>}
