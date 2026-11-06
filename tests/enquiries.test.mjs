import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateEnquiry} from '../lib/enquiries.ts';
const valid={parent:'Test Parent',phone:'+91 98765 43210',email:'parent@example.com',programme:'Day Care',message:'Test enquiry',consent:true,requestId:'8f897d41-e258-4d29-99ea-976ad76be565'};
test('accepts the four supported programmes',()=>{for(const programme of ['Day Care','Junior KG','Senior KG','After School'])assert.ok(validateEnquiry({...valid,programme}))});
test('rejects invalid and unconsented enquiries',()=>{for(const fields of [{parent:' '},{phone:'abc12345'},{phone:'-------'},{email:'bad-email'},{programme:'Nursery'},{consent:false},{requestId:'bad-id'},{message:'a'.repeat(2001)}])assert.equal(validateEnquiry({...valid,...fields}),null)});
test('optional email and message allowed; input is trimmed',()=>{assert.equal(validateEnquiry({...valid,parent:'  Test Parent  ',email:'',message:''})?.parent,'Test Parent')});
