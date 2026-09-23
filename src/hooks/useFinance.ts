import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type UiTransaction={
  id:string; date:string; description:string; amount:number;
  category:string; account:string; source:string; type:string;
};

const defaultCategories=[
  ["Alimentação","expense"],["Transporte","expense"],["Lazer","expense"],["Pets","expense"],
  ["Compras","expense"],["Moradia","expense"],["Saúde","expense"],["Assinaturas","expense"],
  ["Receitas","income"],["Investimentos","investment"]
] as const;

export function useFinance(session:Session){
  const userId=session.user.id;
  const [loading,setLoading]=useState(true);
  const [transactions,setTransactions]=useState<UiTransaction[]>([]);
  const [categories,setCategories]=useState<{id:string;name:string;kind:string}[]>([]);
  const [accounts,setAccounts]=useState<{id:string;name:string}[]>([]);

  const bootstrap=useCallback(async()=>{
    setLoading(true);
    await supabase.from("profiles").upsert({id:userId,full_name:session.user.email ?? null});
    let { data:cats }=await supabase.from("categories").select("id,name,kind").order("name");
    if(!cats?.length){
      await supabase.from("categories").insert(defaultCategories.map(([name,kind])=>({user_id:userId,name,kind})));
      cats=(await supabase.from("categories").select("id,name,kind").order("name")).data ?? [];
    }
    let { data:accs }=await supabase.from("accounts").select("id,name").order("name");
    if(!accs?.length){
      await supabase.from("accounts").insert({user_id:userId,name:"Conta principal",type:"checking",institution:"Principal"});
      accs=(await supabase.from("accounts").select("id,name").order("name")).data ?? [];
    }
    setCategories(cats ?? []);
    setAccounts(accs ?? []);
    await refresh(cats ?? [],accs ?? []);
    setLoading(false);
  },[userId]);

  const refresh=useCallback(async(catsOverride?:{id:string;name:string;kind:string}[],accsOverride?:{id:string;name:string}[])=>{
    const cats=catsOverride ?? categories;
    const accs=accsOverride ?? accounts;
    const { data,error }=await supabase.from("transactions")
      .select("id,occurred_at,description,amount,source,transaction_type,category_id,account_id")
      .order("occurred_at",{ascending:false});
    if(error) throw error;
    const catMap=new Map(cats.map(c=>[c.id,c.name]));
    const accMap=new Map(accs.map(a=>[a.id,a.name]));
    setTransactions((data??[]).map(t=>({
      id:t.id,date:t.occurred_at,description:t.description,amount:Number(t.amount),
      category:t.category_id?catMap.get(t.category_id)??"Sem categoria":"Sem categoria",
      account:t.account_id?accMap.get(t.account_id)??"Sem conta":"Sem conta",
      source:t.source,type:t.transaction_type
    })));
  },[categories,accounts]);

  useEffect(()=>{bootstrap()},[bootstrap]);

  const totals=useMemo(()=>{
    const income=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const expense=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    const investment=transactions.filter(t=>t.type==="investment").reduce((s,t)=>s+t.amount,0);
    return {income,expense,investment,balance:income-expense-investment};
  },[transactions]);

  async function addTransaction(input:{type:"expense"|"income"|"investment";description:string;amount:number;categoryId?:string;accountId?:string;}){
    const {error}=await supabase.from("transactions").insert({
      user_id:userId,transaction_type:input.type,description:input.description,amount:input.amount,
      category_id:input.categoryId||null,account_id:input.accountId||null,source:"manual",
      occurred_at:new Date().toISOString(),competence_date:new Date().toISOString().slice(0,10)
    });
    if(error) throw error;
    await refresh();
  }

  async function removeTransaction(id:string){
    const {error}=await supabase.from("transactions").delete().eq("id",id);
    if(error) throw error;
    await refresh();
  }

  return {loading,transactions,categories,accounts,totals,addTransaction,removeTransaction,refresh};
}
