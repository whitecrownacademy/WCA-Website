'use client';

import {useRef} from 'react';
import Image from 'next/image';
import {motion,useScroll,useTransform,useReducedMotion,type MotionValue} from 'framer-motion';
import {ArrowUpRight,Heart,Sun,Sprout,Sparkles} from 'lucide-react';
import {programmes} from '@/data/content';
import {programmeImages} from '@/data/assets';

const icons={heart:Heart,sun:Sun,sprout:Sprout,sparkles:Sparkles};
type Programme=(typeof programmes)[number];

function ProgrammeCard({programme,index,progress}:{programme:Programme;index:number;progress:MotionValue<number>}){
 const reduced=useReducedMotion();
 const imageY=useTransform(progress,[0,1],[-18,18]);
 const decorationY=useTransform(progress,[0,1],[8,-8]);
 const decorationRotate=useTransform(progress,[0,1],[-18,22]);
 const Icon=icons[programme.icon];
 const photo=programmeImages[programme.slug];
 return <motion.article id={programme.slug} className={`programme-card photo-programme ${programme.tone}`} >
  <div className="programme-top"><span>0{index+1}</span></div>
  <div className={`programme-photo-window window-${index}`}>
   <motion.div className="programme-photo-layer" style={reduced?undefined:{y:imageY}}>
    <Image src={photo.src} alt={photo.alt} fill sizes="(max-width:500px) 90vw, (max-width:800px) 44vw, 25vw" style={{objectPosition:photo.position}}/>
   </motion.div>
   <span className="programme-image-caption">Illustrative image</span>
  </div>
  <motion.span aria-hidden="true" className="programme-photo-sticker" style={reduced?undefined:{y:decorationY,rotate:decorationRotate}}><Icon size={21} strokeWidth={1.5}/></motion.span>
  <p className="eyebrow">{programme.tag}</p><h3>{programme.name}</h3><p>{programme.text}</p>
  <a href="#admissions">Enquire about {programme.name}<ArrowUpRight size={19}/></a>
 </motion.article>;
}

export function ProgrammeCards(){
 const ref=useRef<HTMLDivElement>(null);
 const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
 return <div ref={ref} className="programme-parallax-stage"><div className="programme-grid">{programmes.map((programme,index)=><ProgrammeCard programme={programme} index={index} progress={scrollYProgress} key={programme.slug}/>)}</div></div>;
}



