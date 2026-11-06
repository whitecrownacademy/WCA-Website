'use client';
import {useRef,useState} from 'react';
import {ArrowUpRight,CheckCircle,AlertCircle} from 'lucide-react';
import {programmes} from '@/data/content';
export function EnquiryForm(){
 const[status,setStatus]=useState<'idle'|'loading'|'success'|'error'>('idle');
 const[message,setMessage]=useState('');
 const requestId=useRef<string|null>(null);
 const busy=useRef(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy.current)return;
  const form=e.currentTarget;if(!form.reportValidity())return;
  const data=new FormData(form);
  requestId.current??=crypto.randomUUID();
  const payload={requestId:requestId.current,parent:String(data.get('parent')).trim(),phone:String(data.get('phone')).trim(),email:String(data.get('email')).trim(),programme:String(data.get('programme')),message:String(data.get('message')).trim(),consent:data.get('consent')==='on',website:String(data.get('website')||'')};
  if(payload.parent.length<2){setStatus('error');setMessage('Please enter your name (at least two characters).');return}
  busy.current=true;setStatus('loading');setMessage('');
  try{
   const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
   const result=await response.json();
   if(!response.ok||result.success!==true)throw new Error(result.error||'Your enquiry could not be saved. Please try again.');
   setStatus('success');setMessage('Thank you. Your enquiry has been received by White Crown Academy.');form.reset();requestId.current=null;
  }catch(error){setStatus('error');setMessage(error instanceof Error&&error.name==='TimeoutError'?'The connection took too long. Please try again.':error instanceof Error?error.message:'Please check your connection and try again.');}
  finally{busy.current=false}
 }
 return <form className="enquiry-form" onSubmit={submit} aria-busy={status==='loading'}><h3>Tell us a little about your enquiry.</h3><fieldset disabled={status==='loading'} className="enquiry-fields"><div className="form-grid"><label>Your name <span>*</span><input name="parent" required minLength={2} maxLength={100} autoComplete="name" placeholder="Parent or guardian’s name"/></label><label>Phone number <span>*</span><input name="phone" type="tel" required pattern="[+0-9 ()\-]{7,20}" maxLength={20} autoComplete="tel" placeholder="Your contact number"/></label><label>Email address<input name="email" type="email" maxLength={254} autoComplete="email" placeholder="you@example.com"/></label><label>Programme <span>*</span><select name="programme" required defaultValue=""><option value="" disabled>Select a programme</option>{programmes.map(p=><option key={p.slug}>{p.name}</option>)}</select></label></div><label>What would you like to know?<textarea name="message" rows={3} maxLength={2000} placeholder="Share your questions or ask about a visit."/></label><div className="enquiry-honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="consent"><input type="checkbox" name="consent" required/>I agree to White Crown Academy storing these details and contacting me about my enquiry.</label><button className="button" type="submit">{status==='loading'?'Sending enquiry…':'Send my enquiry'}<ArrowUpRight size={18}/></button></fieldset><p className="tiny">Your name, contact details, and message are saved to process your admissions enquiry. Please avoid including sensitive information about your child.</p>{status==='success'&&<div className="form-status success" role="status"><CheckCircle size={20}/><p>{message}</p></div>}{status==='error'&&<div className="form-status error" role="alert"><AlertCircle size={20}/><p>{message}</p></div>}</form>
}
