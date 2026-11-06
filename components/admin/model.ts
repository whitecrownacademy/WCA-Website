export type Enquiry={id:string;created_at:string;parent_name:string;phone:string;email:string|null;programme:string;message:string|null;status:'new'|'contacted'|'closed';notes:string;updated_at:string};
export const statusLabels={new:'New',contacted:'Contacted',closed:'Closed'};
export function csvCell(value:unknown){const text=String(value??'');return '"'+(/^[\s]*[=+\-@]|^[\t\r]/.test(text)?"'"+text:text).replaceAll('"','""')+'"'}
export function dateLabel(value:string){return new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'})}
export function indiaDay(value:string|Date){return new Date(value).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})}

