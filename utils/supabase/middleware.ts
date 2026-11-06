import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {getSupabaseConfig,hasSupabaseConfig} from './config';

export async function updateSession(request:NextRequest){
 let response=NextResponse.next({request});
 // Keep the public site available before hosting environment variables are added.
 if(!hasSupabaseConfig())return response;
 const {url,key}=getSupabaseConfig();
 const supabase=createServerClient(url,key,{
  cookies:{
   getAll(){return request.cookies.getAll()},
   setAll(cookiesToSet,headers){
    cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
    response=NextResponse.next({request});
    cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    Object.entries(headers??{}).forEach(([name,value])=>response.headers.set(name,value));
   },
  },
 });
 // Creating a client alone does not refresh tokens. Verify/refresh before rendering.
 await supabase.auth.getClaims();
 // Public pages do not require a user; protect future private routes separately.
 return response;
}
