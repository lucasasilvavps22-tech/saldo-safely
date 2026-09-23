import { FormEvent, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Auth(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");

  async function submit(e:FormEvent){
    e.preventDefault();
    setLoading(true); setMessage("");
    try{
      if(mode==="signup"){
        const { error }=await supabase.auth.signUp({email,password});
        if(error) throw error;
        setMessage("Conta criada. Se a confirmação de e-mail estiver ativa, confirme seu e-mail antes de entrar.");
      } else {
        const { error }=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
      }
    }catch(err:any){
      setMessage(err?.message ?? "Não foi possível autenticar.");
    }finally{setLoading(false)}
  }

  return <div className="auth-shell">
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-brand"><strong>saldo safely</strong><span>controle financeiro pessoal</span></div>
      <h1>{mode==="login"?"Entrar":"Criar conta"}</h1>
      <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Senha<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      <button className="primary auth-submit" disabled={loading}>{loading?"Aguarde...":mode==="login"?"Entrar":"Criar conta"}</button>
      {message&&<p className="auth-message">{message}</p>}
      <button type="button" className="link-button" onClick={()=>setMode(mode==="login"?"signup":"login")}>
        {mode==="login"?"Ainda não tenho conta":"Já tenho conta"}
      </button>
    </form>
  </div>
}
