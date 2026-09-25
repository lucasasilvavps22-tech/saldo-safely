import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CreditCard, LayoutDashboard, LogOut, MessageCircle, PiggyBank, Receipt, Tags, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Auth from "./Auth";
import { useFinance } from "./hooks/useFinance";
import { supabase } from "./lib/supabase";

const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
type View="dashboard"|"transactions"|"budgets"|"cards"|"categories"|"assistant";

export default function App(){
 const [session,setSession]=useState<Session|null>(null);
 const [checking,setChecking]=useState(true);

 useEffect(()=>{
   supabase.auth.getSession().then(({data})=>{setSession(data.session);setChecking(false)});
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
   return ()=>subscription.unsubscribe();
 },[]);

 if(checking) return <div className="center-screen">Carregando...</div>;
 if(!session) return <Auth/>;
 return <FinanceApp session={session}/>;
}

function FinanceApp({session}:{session:Session}){
 const finance=useFinance(session);
 const [view,setView]=useState<View>("dashboard");
 const [selectedCategory,setSelectedCategory]=useState<string|null>(null);
 const [showNew,setShowNew]=useState(false);

 const expenses=finance.transactions.filter(t=>t.type==="expense");
 const categoryData=useMemo(()=>{
   const map=new Map<string,number>();
   expenses.forEach(t=>map.set(t.category,(map.get(t.category)||0)+t.amount));
   return [...map.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
 },[finance.transactions]);
 const selected=selectedCategory?expenses.filter(t=>t.category===selectedCategory):[];
 const nav=[["dashboard","Dashboard",LayoutDashboard],["transactions","Transações",Receipt],["budgets","Orçamentos",PiggyBank],["cards","Cartões e Contas",CreditCard],["categories","Categorias",Tags],["assistant","Assistente WhatsApp",MessageCircle]] as const;

 if(finance.loading) return <div className="center-screen">Preparando seu ambiente financeiro...</div>;

 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand"><WalletCards size={24}/><div><strong>saldo safely</strong><span>finanças pessoais</span></div></div>
   <nav>{nav.map(([id,label,Icon])=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><Icon size={18}/><span>{label}</span></button>)}</nav>
   <button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/><span>Sair</span></button>
  </aside>
  <main className="content">
   <header className="topbar">
    <div><h1>{nav.find(n=>n[0]===view)?.[1]}</h1><p>{session.user.email}</p></div>
    <button className="primary" onClick={()=>setShowNew(true)}>+ Novo lançamento</button>
   </header>

   {view==="dashboard"&&<>
    <section className="kpi-grid">
     <Kpi label="Receitas" value={money(finance.totals.income)} helper="lançamentos reais"/>
     <Kpi label="Despesas" value={money(finance.totals.expense)} helper="lançamentos reais"/>
     <Kpi label="Saldo" value={money(finance.totals.balance)} helper="após despesas e aportes"/>
     <Kpi label="Aportes" value={money(finance.totals.investment)} helper="investimentos"/>
    </section>
    <section className="two-col">
     <Panel title="Despesas por categoria" subtitle="Clique numa barra para ver os lançamentos">
      <div className="chart"><ResponsiveContainer width="100%" height={300}><BarChart data={categoryData} layout="vertical" onClick={(s:any)=>s?.activeLabel&&setSelectedCategory(s.activeLabel)}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number"/><YAxis type="category" dataKey="name" width={95}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Bar dataKey="value" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div>
     </Panel>
     <Panel title="Resumo rápido" subtitle="Base real do Supabase">
      <div className="summary-stack">
       <Summary label="Transações cadastradas" value={String(finance.transactions.length)}/>
       <Summary label="Categorias" value={String(finance.categories.length)}/>
       <Summary label="Contas" value={String(finance.accounts.length)}/>
       <Summary label="Origem WhatsApp" value={String(finance.transactions.filter(t=>t.source==="whatsapp").length)}/>
      </div>
     </Panel>
    </section>
    <Panel title="Transações recentes"><TransactionsTable rows={finance.transactions.slice(0,8)} onDelete={finance.removeTransaction}/></Panel>
   </>}

   {view==="transactions"&&<Panel title="Todas as transações" subtitle="Dados persistidos no Supabase"><TransactionsTable rows={finance.transactions} onDelete={finance.removeTransaction}/></Panel>}
   {view==="budgets"&&<EmptyState title="Orçamentos" text="A estrutura de banco já está pronta. A próxima etapa ligará metas mensais por categoria."/>}
   {view==="cards"&&<EmptyState title="Cartões e contas" text="Sua conta principal já é criada automaticamente. Cadastro de cartões entra na próxima etapa."/>}
   {view==="categories"&&<div className="grid-cards">{finance.categories.map(c=><div className="simple-card" key={c.id}><h3>{c.name}</h3><span>{c.kind}</span></div>)}</div>}
   {view==="assistant"&&<Assistant/>}

   {selectedCategory&&<div className="drawer-backdrop" onClick={()=>setSelectedCategory(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><h2>{selectedCategory}</h2><p>{selected.length} lançamento(s)</p></div><button onClick={()=>setSelectedCategory(null)}>×</button></div>{selected.map(t=><div className="drawer-item" key={t.id}><div><strong>{t.description}</strong><span>{new Date(t.date).toLocaleDateString("pt-BR")} · {t.account}</span></div><b>{money(t.amount)}</b></div>)}</aside></div>}
   {showNew&&<NewTransactionModal categories={finance.categories} accounts={finance.accounts} onClose={()=>setShowNew(false)} onSave={async(v)=>{await finance.addTransaction(v);setShowNew(false)}}/>}
  </main>
 </div>
}

function NewTransactionModal({categories,accounts,onClose,onSave}:{categories:{id:string;name:string;kind:string}[];accounts:{id:string;name:string}[];onClose:()=>void;onSave:(v:{type:"expense"|"income"|"investment";description:string;amount:number;categoryId?:string;accountId?:string})=>Promise<void>}){
 const [type,setType]=useState<"expense"|"income"|"investment">("expense");
 const [description,setDescription]=useState("");
 const [amount,setAmount]=useState("");
 const [categoryId,setCategoryId]=useState("");
 const [accountId,setAccountId]=useState(accounts[0]?.id??"");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const eligible=categories.filter(c=>c.kind===type);

 useEffect(()=>{setCategoryId(eligible[0]?.id??"")},[type]);

 async function submit(e:FormEvent){
  e.preventDefault(); setError("");
  const parsed=Number(amount.replace(",","."));
  if(!parsed||parsed<=0){setError("Informe um valor válido.");return}
  try{setSaving(true);await onSave({type,description,amount:parsed,categoryId,accountId})}
  catch(err:any){setError(err?.message??"Erro ao salvar lançamento.")}
  finally{setSaving(false)}
 }
 return <div className="modal-backdrop" onClick={onClose}><form className="modal-card" onSubmit={submit} onClick={e=>e.stopPropagation()}>
  <div className="modal-head"><h2>Novo lançamento</h2><button type="button" onClick={onClose}>×</button></div>
  <label>Tipo<select value={type} onChange={e=>setType(e.target.value as any)}><option value="expense">Despesa</option><option value="income">Receita</option><option value="investment">Aporte / investimento</option></select></label>
  <label>Descrição<input value={description} onChange={e=>setDescription(e.target.value)} required placeholder="Ex.: almoço, combustível, salário"/></label>
  <label>Valor<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" required placeholder="0,00"/></label>
  <label>Categoria<select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>{eligible.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label>Conta<select value={accountId} onChange={e=>setAccountId(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
  {error&&<p className="form-error">{error}</p>}
  <button className="primary" disabled={saving}>{saving?"Salvando...":"Salvar lançamento"}</button>
 </form></div>
}

function Kpi(p:{label:string,value:string,helper:string}){return <div className="kpi"><span>{p.label}</span><strong>{p.value}</strong><small>{p.helper}</small></div>}
function Summary({label,value}:{label:string;value:string}){return <div className="summary-row"><span>{label}</span><strong>{value}</strong></div>}
function Panel(p:{title:string,subtitle?:string,children:any}){return <section className="card"><div className="card-head"><h2>{p.title}</h2>{p.subtitle&&<p>{p.subtitle}</p>}</div>{p.children}</section>}
function TransactionsTable({rows,onDelete}:{rows:any[];onDelete:(id:string)=>Promise<void>}){return <div className="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Origem</th><th>Valor</th><th></th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td>{new Date(t.date).toLocaleDateString("pt-BR")}</td><td>{t.description}</td><td>{t.category}</td><td>{t.account}</td><td>{t.source}</td><td className={t.type==="income"?"positive":t.type==="investment"?"investment":"negative"}>{t.type==="income"?"+ ":"- "}{money(t.amount)}</td><td><button className="ghost-danger" onClick={()=>onDelete(t.id)}>Excluir</button></td></tr>)}</tbody></table>{!rows.length&&<p className="empty-inline">Nenhum lançamento ainda.</p>}</div>}
function EmptyState({title,text}:{title:string;text:string}){return <div className="empty-state"><h2>{title}</h2><p>{text}</p></div>}
function Assistant(){const examples=["Gastei 42,90 no almoço hoje","Recebi 10.300 de salário","180 reais de gasolina no cartão","Comprei uma camisa por 230 em 3x","Quanto gastei com restaurantes este mês?","Apaga o último lançamento"];return <div className="assistant-grid"><Panel title="Assistente WhatsApp" subtitle="Próxima integração: WhatsApp Business Platform"><div className="chat-demo">{examples.map((e,i)=><div className="bubble user" key={i}>{e}</div>)}</div></Panel><Panel title="Como funcionará"><p>O webhook receberá a mensagem, interpretará valor, tipo e categoria e registrará a transação no mesmo banco usado por este dashboard.</p></Panel></div>}
