import {NextRequest,NextResponse} from 'next/server';
import {SESSION_COOKIE} from '@/lib/admin/session';
import {sameOrigin,privateHeaders} from '@/lib/admin/server';
export async function POST(request:NextRequest){if(!sameOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403,headers:privateHeaders});const response=NextResponse.json({success:true},{headers:privateHeaders});response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return response}
