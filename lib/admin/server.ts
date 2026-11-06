import {cookies} from 'next/headers';
import {createClient} from '@supabase/supabase-js';
import {NextRequest} from 'next/server';
import {SESSION_COOKIE,validSession} from './session';
export async function isAdmin(){return validSession((await cookies()).get(SESSION_COOKIE)?.value)}
export function adminDatabase(){const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;if(!url||!key)throw new Error('ADMIN_DATABASE_NOT_CONFIGURED');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export function sameOrigin(request:NextRequest){return request.headers.get('origin')===request.nextUrl.origin}
export const privateHeaders={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache'};

