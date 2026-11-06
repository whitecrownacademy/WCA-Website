export const allowedProgrammes=['Day Care','Junior KG','Senior KG','After School'] as const;
export function validateEnquiry(input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const value=input as Record<string,unknown>;
 const text=(name:string)=>typeof value[name]==='string'?(value[name] as string).trim():'';
 const parent=text('parent'),phone=text('phone'),email=text('email'),programme=text('programme'),message=text('message'),requestId=text('requestId');
 if(parent.length<2||parent.length>100||!/^\+?[0-9 ()-]{7,20}$/.test(phone)||phone.replace(/\D/g,'').length<7||email.length>254||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||!allowedProgrammes.includes(programme as typeof allowedProgrammes[number])||message.length>2000||value.consent!==true||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))return null;
 return {parent,phone,email,programme,message,requestId};
}
