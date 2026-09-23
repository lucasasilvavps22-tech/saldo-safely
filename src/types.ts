export type TransactionType = "expense" | "income" | "transfer" | "investment";
export interface Transaction { id:string; date:string; description:string; amount:number; category:string; subcategory?:string; account:string; source:"whatsapp"|"manual"|"import"; type:TransactionType; }
export interface Budget { category:string; planned:number; actual:number; }
export interface Card { name:string; closingDay:number; dueDay:number; limit:number; currentBill:number; }