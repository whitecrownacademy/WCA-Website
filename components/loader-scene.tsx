'use client';
import {useRef,useCallback} from 'react';
import Script from 'next/script';
import {drawLoaderDoodles} from './loader-doodles';

export function LoaderScene(){
 const ref=useRef<HTMLDivElement>(null);
 const draw=useCallback(()=>{
  const root=ref.current;
  const rough=(window as Window & {rough?:unknown}).rough;
  if(!root||!rough||root.dataset.drawn)return;
  root.dataset.drawn='true';
  drawLoaderDoodles(root,rough);
 },[]);
 return <div ref={ref} className="loader-scene" aria-hidden="true">
  <svg data-doodle="hero" viewBox="-380 0 1960 520" preserveAspectRatio="xMidYMax meet" focusable="false"/>
  <Script src="/loader/rough.min.js" strategy="afterInteractive" onReady={draw}/>
 </div>;
}
