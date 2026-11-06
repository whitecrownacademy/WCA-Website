import {NextRequest,NextResponse} from 'next/server';
import {configured,passwordMatches,makeSession,SESSION_COOKIE,SESSION_SECONDS,attemptKey} from '@/lib/admin/session';
import {adminDatabase,sameOrigin,privateHeaders} from '@/lib/admin/server';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:privateHeaders});
 if(!sameOrigin(request))return reply('Please sign in from this website.',403);
 if(!configured())return reply('Admin login is not configured. Add the admin environment variables in Vercel.',503);
 let password:string;
 try{const body=await request.text();if(body.length>2000)return reply('Invalid request.',400);const parsed=JSON.parse(body);if(typeof parsed.password!=='string'||parsed.password.length>512)return reply('Enter your admin password.',400);password=parsed.password}catch{return reply('Invalid request.',400)}
 try{
  const db=adminDatabase();
  const ip=process.env.VERCEL?request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown':'local';
  const {data,error}=await db.rpc('consume_admin_login_attempt',{p_key:attemptKey(ip)});
  if(error)return reply('Admin login setup is incomplete. Apply the admin database migration.',503);
  if(data!==true)return reply('Too many login attempts. Try again in 15 minutes.',429);
 }catch{return reply('Admin database connection is not configured.',503)}
 if(!passwordMatches(password))return reply('Incorrect password.',401);
 const response=NextResponse.json({success:true},{headers:privateHeaders});
 response.cookies.set(SESSION_COOKIE,makeSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:SESSION_SECONDS});return response;
}
