'use client';
import {LoaderScene} from './loader-scene';

import {useEffect,useState} from 'react';
import {loaderLogo} from './loader-logo';

function Skeleton(){return <div className="loader-skeleton" aria-hidden="true"><div className="skeleton-header"><i className="sk sk-brand"/><div><i className="sk"/><i className="sk"/><i className="sk"/></div><i className="sk sk-button"/></div><div className="skeleton-hero"><div className="skeleton-copy"><i className="sk sk-eyebrow"/><i className="sk sk-heading"/><i className="sk sk-heading"/><i className="sk sk-heading short"/><i className="sk sk-line"/><i className="sk sk-line short"/><div className="sk-actions"><i className="sk sk-button"/><i className="sk sk-button"/></div></div><div className="sk sk-photo"/></div><div className="skeleton-strip">{[0,1,2,3].map(n=><i className="sk" key={n}/>)}</div><div className="skeleton-cards">{[0,1,2,3].map(n=><i className="sk" key={n}/>)}</div></div>}

export function SiteLoader({children}:{children:React.ReactNode}){
 const[visible,setVisible]=useState(true);
 const[leaving,setLeaving]=useState(false);
 useEffect(()=>{
  let disposed=false,exitTimer:ReturnType<typeof setTimeout>;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const previousOverflow=document.documentElement.style.overflow;
  document.documentElement.style.overflow='hidden';
  const minimum=new Promise<void>(resolve=>setTimeout(resolve,reduced?0:3400));
  const loaded=new Promise<void>(resolve=>{if(document.readyState==='complete')resolve();else window.addEventListener('load',()=>resolve(),{once:true})});
  const fonts=document.fonts?.ready.catch(()=>undefined)??Promise.resolve();
  const ready=Promise.all([loaded,fonts]);
  let timeout:ReturnType<typeof setTimeout>;
  const boundedReady=Promise.race([ready,new Promise<void>(resolve=>{timeout=setTimeout(resolve,6500)})]);
  Promise.all([minimum,boundedReady]).then(()=>{if(disposed)return;clearTimeout(timeout);setLeaving(true);exitTimer=setTimeout(()=>{if(!disposed){setVisible(false);document.documentElement.style.overflow=previousOverflow}},reduced?0:550)});
  return()=>{disposed=true;clearTimeout(timeout);clearTimeout(exitTimer);document.documentElement.style.overflow=previousOverflow};
 },[]);
 return <><div className="loaded-site" inert={visible} aria-hidden={visible?true:undefined}>{children}</div>{visible&&<div className={`site-loader${leaving?' is-leaving':''}`} role="status" aria-live="polite" aria-label="Loading White Crown Academy"><Skeleton/><LoaderScene/><div className="loader-focus"><div className="loader-logo-wrap" dangerouslySetInnerHTML={{__html:loaderLogo}}/><div className="loader-wordmark">WHITE CROWN<span>ACADEMY</span></div><p>A beautiful beginning is on its way.</p><div className="loader-track" aria-hidden="true"><span/></div></div></div>}<noscript><style>{'.site-loader{display:none!important}.loaded-site{visibility:visible!important}'}</style></noscript></>;
}

