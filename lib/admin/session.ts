import {createHmac,createHash,timingSafeEqual,randomUUID} from 'node:crypto';
export const SESSION_COOKIE='wca_admin_session';
export const SESSION_SECONDS=60*60*8;
export function configured(){return Boolean(process.env.ADMIN_PASSWORD&&process.env.ADMIN_PASSWORD.length>=12&&process.env.ADMIN_SESSION_SECRET&&process.env.ADMIN_SESSION_SECRET.length>=32)}
function signature(value:string){return createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(value).digest('base64url')}
export function passwordMatches(password:string){if(!configured())return false;return timingSafeEqual(createHash('sha256').update(password).digest(),createHash('sha256').update(process.env.ADMIN_PASSWORD!).digest())}
export function makeSession(now=Date.now()){
 const payload=Buffer.from(JSON.stringify({exp:Math.floor(now/1000)+SESSION_SECONDS,nonce:randomUUID(),version:createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(process.env.ADMIN_PASSWORD!).digest('hex')})).toString('base64url');
 return `${payload}.${signature(payload)}`;
}
export function validSession(token:string|undefined,now=Date.now()){
 if(!token||!configured()||token.length>2000)return false;
 try{const parts=token.split('.');if(parts.length!==2)return false;const expected=Buffer.from(signature(parts[0]));const supplied=Buffer.from(parts[1]);if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))return false;const value=JSON.parse(Buffer.from(parts[0],'base64url').toString());return typeof value.exp==='number'&&value.exp>Math.floor(now/1000)&&value.version===createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(process.env.ADMIN_PASSWORD!).digest('hex')}catch{return false}
}
export function attemptKey(ip:string){return createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(ip).digest('hex')}

