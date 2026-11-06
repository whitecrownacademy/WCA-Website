import {NextRequest,NextResponse} from 'next/server';
import {adminDatabase,isAdmin,sameOrigin,privateHeaders} from '@/lib/admin/server';
export const runtime='nodejs';
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:'Please sign in again.'},{status:401,headers:privateHeaders});
 try{const {data,error,count}=await adminDatabase().from('admission_enquiries').select('id,created_at,parent_name,phone,email,programme,message,status,notes,updated_at',{count:'exact'}).order('created_at',{ascending:false}).limit(1000);if(error)throw error;return NextResponse.json({enquiries:data,total:count},{headers:privateHeaders})}catch{return NextResponse.json({error:'Could not load enquiries. Check the server secret key and apply the admin database migration.'},{status:503,headers:privateHeaders})}
}
export async function PATCH(request:NextRequest){
 if(!sameOrigin(request))return NextResponse.json({error:'Invalid origin.'},{status:403,headers:privateHeaders});
 if(!await isAdmin())return NextResponse.json({error:'Please sign in again.'},{status:401,headers:privateHeaders});
 try{
  const raw=await request.text();if(raw.length>14000)return NextResponse.json({error:'Note is too long.'},{status:400,headers:privateHeaders});
  const body=JSON.parse(raw);
  if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id)||!['new','contacted','closed'].includes(body.status)||typeof body.notes!=='string'||body.notes.length>5000||typeof body.updated_at!=='string')return NextResponse.json({error:'Check the enquiry status and note.'},{status:400,headers:privateHeaders});
  const {data,error}=await adminDatabase().from('admission_enquiries').update({status:body.status,notes:body.notes.trim(),updated_at:new Date().toISOString()}).eq('id',body.id).eq('updated_at',body.updated_at).select('id,status,notes,updated_at').maybeSingle();
  if(error)throw error;if(!data)return NextResponse.json({error:'This enquiry changed elsewhere. Refresh before saving.'},{status:409,headers:privateHeaders});
  return NextResponse.json({enquiry:data},{headers:privateHeaders});
 }catch{return NextResponse.json({error:'Could not save changes. Please try again.'},{status:503,headers:privateHeaders})}
}
