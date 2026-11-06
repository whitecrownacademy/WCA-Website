import {SiteLoader} from '@/components/site-loader';
import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'White Crown Academy | A beautiful beginning',description:'Explore Day Care, Junior KG, Senior KG and After School at White Crown Academy. Homepage design preview.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteLoader>{children}</SiteLoader></body></html>}

