import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeSession,validSession,passwordMatches} from '../lib/admin/session.ts';
import {csvCell} from '../components/admin/model.ts';
process.env.ADMIN_PASSWORD='test-password-only-for-unit-tests';
process.env.ADMIN_SESSION_SECRET='test-signing-secret-only-for-unit-tests';
test('sessions reject tampering, expiry and password rotation',()=>{const now=Date.now();const token=makeSession(now);assert.equal(validSession(token,now),true);assert.equal(validSession(token+'x',now),false);assert.equal(validSession(token,now+9*3600000),false);process.env.ADMIN_PASSWORD='another-test-password-for-unit-tests';assert.equal(validSession(token,now),false);process.env.ADMIN_PASSWORD='test-password-only-for-unit-tests'});
test('password comparison and missing config fail closed',()=>{assert.equal(passwordMatches('wrong'),false);assert.equal(passwordMatches(process.env.ADMIN_PASSWORD),true);const previous=process.env.ADMIN_SESSION_SECRET;delete process.env.ADMIN_SESSION_SECRET;assert.equal(validSession('anything'),false);assert.equal(passwordMatches(process.env.ADMIN_PASSWORD),false);process.env.ADMIN_SESSION_SECRET=previous});
test('CSV fields neutralize spreadsheet formulas and escape quotes',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('  =1+1'),'"\'  =1+1"');assert.equal(csvCell('A "name"'),'"A ""name"""')});
