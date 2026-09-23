import type { Budget, Card, Transaction } from "./types";
export const transactions: Transaction[] = [
{id:"1",date:"2026-09-22",description:"Salário",amount:10300,category:"Receitas",account:"Conta principal",source:"manual",type:"income"},
{id:"2",date:"2026-09-22",description:"Aporte reserva",amount:2000,category:"Investimentos",subcategory:"Reserva de emergência",account:"Conta principal",source:"manual",type:"investment"},
{id:"3",date:"2026-09-21",description:"Petlove Plano",amount:89.9,category:"Pets",subcategory:"Plano",account:"Cartão Bradesco",source:"import",type:"expense"},
{id:"4",date:"2026-09-20",description:"Coparticipação veterinária",amount:145.5,category:"Pets",subcategory:"Consultas",account:"Cartão Bradesco",source:"import",type:"expense"},
{id:"5",date:"2026-09-19",description:"Abastecimento",amount:187.43,category:"Transporte",subcategory:"Combustível",account:"Cartão Bradesco",source:"whatsapp",type:"expense"},
{id:"6",date:"2026-09-18",description:"Restaurante",amount:318,category:"Alimentação",subcategory:"Restaurantes",account:"Cartão Bradesco",source:"manual",type:"expense"},
{id:"7",date:"2026-09-17",description:"Uber",amount:32.4,category:"Transporte",subcategory:"Mobilidade",account:"Cartão Bradesco",source:"whatsapp",type:"expense"},
{id:"8",date:"2026-09-16",description:"Seguro do carro",amount:412.8,category:"Transporte",subcategory:"Seguro",account:"Cartão Bradesco",source:"import",type:"expense"},
{id:"9",date:"2026-09-15",description:"Roupas",amount:230,category:"Compras",subcategory:"Roupas",account:"Cartão Bradesco",source:"import",type:"expense"},
{id:"10",date:"2026-09-14",description:"Bebidas",amount:280,category:"Lazer",subcategory:"Bebidas",account:"Cartão Bradesco",source:"import",type:"expense"}
];
export const budgets: Budget[] = [
{category:"Alimentação",planned:900,actual:684.3},{category:"Transporte",planned:1200,actual:632.63},{category:"Lazer",planned:500,actual:380},{category:"Pets",planned:450,actual:235.4},{category:"Compras",planned:450,actual:230}
];
export const cards: Card[] = [{name:"Bradesco",closingDay:25,dueDay:5,limit:12000,currentBill:2478.63}];
export const monthly = [
{month:"Abr",income:10100,expense:7240,investment:1800},{month:"Mai",income:10300,expense:7610,investment:1800},{month:"Jun",income:10300,expense:6890,investment:2200},{month:"Jul",income:10300,expense:7420,investment:2000},{month:"Ago",income:10300,expense:7010,investment:2200},{month:"Set",income:10300,expense:2478.63,investment:2000}
];