import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmedInitials, publicProfileLabel, decodeAuthorSnapshot, decodeOperatorBadge } from '../src/domain/membership.ts';
const choice={industry:'pharmaceutical',companySize:'large',roleLayer:'department',familyRomanization:'Kensho',givenRomanization:'Taro'};
const snapshot={profileVersion:1,industry:'pharmaceutical',companySize:'large',roleLayer:'department',initials:'K・T',label:publicProfileLabel(choice),declaration:'self_declared',operatorAtSubmission:false};
test('initials use separately confirmed family/given Latin inputs without inferring a Japanese reading',()=>{
 assert.equal(confirmedInitials('Yamamoto','Taro'),'Y・T'); assert.equal(confirmedInitials(' given ',' family '),'G・F');
 assert.throws(()=>confirmedInitials('山本','太郎')); assert.throws(()=>confirmedInitials('','Taro'));
});
test('public label uses only declared coarse fields and never company/full name/exact title',()=>{
 const label=publicProfileLabel({...choice,companyName:'秘密の架空会社',fullName:'秘密の架空人物',actualTitle:'特定部署の正式職名'});
 assert.equal(label,'製薬業界・大規模企業 / 部門マネジメント / K・T');
 assert.ok(!label.includes('秘密')); assert.ok(!label.includes('特定部署')); assert.throws(()=>publicProfileLabel({...choice,roleLayer:'Owner'}));
});
test('snapshot decoder rejects added private fields, mismatched labels and inflated verification',()=>{
 assert.deepEqual(decodeAuthorSnapshot(snapshot),snapshot);
 for(const value of [{...snapshot,companyName:'private'},{...snapshot,fullName:'private'},{...snapshot,label:'Owner verified'},{...snapshot,declaration:'verified'},{...snapshot,operatorAtSubmission:'true'}]) assert.throws(()=>decodeAuthorSnapshot(value));
});
test('operator display enum cannot come from paid plan, recognition or user metadata object',()=>{
 assert.equal(decodeOperatorBadge('Owner'),'Owner'); assert.equal(decodeOperatorBadge(null),null);
 for(const value of ['Plus','Prime',true,{user_metadata:{operatorBadge:'Owner'}}]) assert.throws(()=>decodeOperatorBadge(value));
});
