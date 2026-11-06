import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {getSupabaseConfig,hasSupabaseConfig} from '@/utils/supabase/config';
import {validateEnquiry} from '@/lib/enquiries';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
 const origin=request.headers.get('origin');
 if(origin&&origin!==request.nextUrl.origin)return reply('Please submit this form from the academy website.',403);
 if(!request.headers.get('content-type')?.includes('application/json'))return reply('Please submit a valid enquiry.',415);
 let raw:unknown;
 try{const body=await request.text();if(body.length>12000)return reply('Your enquiry is too long.',413);raw=JSON.parse(body)}catch{return reply('Please check your enquiry and try again.',400)}
 if(raw&&typeof raw==='object'&&'website' in raw&&(raw as {website:unknown}).website)return reply('Your enquiry could not be submitted.',400);
 const input=validateEnquiry(raw);
 if(!input)return reply('Please check your name, contact details, programme, and consent.',400);
 if(!hasSupabaseConfig())return reply('Enquiries are temporarily unavailable. Please try again later.',503);
 const {url,key}=getSupabaseConfig();
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const {data,error}=await supabase.rpc('submit_admission_enquiry',{p_request_id:input.requestId,p_parent:input.parent,p_phone:input.phone,p_email:input.email||null,p_programme:input.programme,p_message:input.message||null});
  if(error){if(error.message.includes('ENQUIRY_RATE_LIMIT'))return reply('You have sent several enquiries recently. Please try again in 15 minutes.',429);return reply('We could not save your enquiry. Please try again shortly.',503)}
  if(!data)return reply('We could not confirm your enquiry. Please try again.',503);
  return NextResponse.json({success:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return reply('We could not reach the admissions service. Please try again.',503)}
}
