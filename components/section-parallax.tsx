'use client';
import {useRef} from 'react';
import {motion,useScroll,useTransform,useReducedMotion} from 'framer-motion';

/** Stable outer bounds keep scroll measurements independent of the moving section. */
export function SectionParallax({children,tone='cream',order=0}:{children:React.ReactNode;tone?:'cream'|'blue'|'dark'|'sage';order?:number}){
 const ref=useRef<HTMLDivElement>(null);
 const reduced=useReducedMotion();
 const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
 const y=useTransform(scrollYProgress,[0,.22,.55,1],[90,0,0,145]);
 const scale=useTransform(scrollYProgress,[0,.22,.55,1],[.97,1,1,.95]);
 const opacity=useTransform(scrollYProgress,[0,.15,.65,1],[.8,1,1,.65]);
 return <div ref={ref} className={`section-parallax-shell tone-${tone}`} style={{zIndex:order+1}}><motion.div className="section-parallax-layer" style={reduced?undefined:{y,scale,opacity}}>{children}</motion.div></div>;
}
