import type {Metadata} from 'next';
import {isAdmin} from '@/lib/admin/server';
import {AdminLogin} from '@/components/admin/login';
import {AdminDashboard} from '@/components/admin/dashboard';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Admin | White Crown Academy',robots:{index:false,follow:false}};
export default async function AdminPage(){return await isAdmin()?<AdminDashboard/>:<AdminLogin/>}
