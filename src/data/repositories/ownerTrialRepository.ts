import type { SupabaseClient } from '@supabase/supabase-js';
import { decodeReviewCapabilities, decodeOwnReviews, ReviewGatewayError, type OwnReviewSummary, type ReviewCapabilities } from './proposedReviewRepository.ts';
import { decodePilotCatalog, OWNER_TRIAL_POLICY } from '../../domain/ownerTrial.ts';
import { decodeAuthorSnapshot } from '../../domain/membership.ts';
import { isUuid } from '../../domain/reviews.ts';
const record=(value:unknown):value is Record<string,unknown>=>!!value && typeof value==='object' && !Array.isArray(value);
export interface OwnerTrialContext extends ReviewCapabilities { ownerTrial: true; dummyOnly: true; active: boolean; endsAt: string }
export interface TrialReview extends OwnReviewSummary { testEntry: true }
export interface TrialProfile { version: number; publicConsented: boolean }
export class OwnerTrialRepository {
 private client: Pick<SupabaseClient,'rpc'>;
 constructor(client:Pick<SupabaseClient,'rpc'>) { this.client=client; }
 private async rpc(name:string,args:Record<string,unknown>={},signal?:AbortSignal,mutation=false):Promise<unknown> {
   let response;
   try { const request=this.client.rpc(`dining_owner_trial_${name}`,args); response=await(signal?request.abortSignal(signal):request); }
   catch { throw new ReviewGatewayError(mutation?'unconfirmed':'unavailable'); }
   if(response.error) { const code=response.error.code; throw new ReviewGatewayError(code==='42501'?'denied':code==='40001'?'conflict':code==='23505'?'duplicate':code==='54000'?'limited':code==='22023'||code==='23514'?'invalid':mutation?'unconfirmed':'unavailable'); }
   return response.data as unknown;
 }
 async context(signal?:AbortSignal):Promise<OwnerTrialContext> {
   const value=await this.rpc('context',{},signal); const base=decodeReviewCapabilities(value);
   if(!record(value)||value.ownerTrial!==true||value.dummyOnly!==true||typeof value.active!=='boolean'||typeof value.endsAt!=='string'||!Number.isFinite(Date.parse(value.endsAt))||base.policyVersion!==OWNER_TRIAL_POLICY) throw new ReviewGatewayError('unavailable');
   return {...base,ownerTrial:true,dummyOnly:true,active:value.active,endsAt:value.endsAt};
 }
 async catalog(signal?:AbortSignal) { return decodePilotCatalog(await this.rpc('catalog',{},signal)); }
 async profile(signal?:AbortSignal):Promise<TrialProfile|null> {
   const value=await this.rpc('profile',{},signal); if(value===null)return null;
   if(!record(value)||!Number.isInteger(value.version)||Number(value.version)<1||typeof value.publicConsented!=='boolean') throw new ReviewGatewayError('unavailable');
   if(value.publicConsented)decodeAuthorSnapshot(value.publicAuthor);
   return {version:value.version as number,publicConsented:value.publicConsented};
 }
 private reviews(value:unknown):TrialReview[] {
   const rows=decodeOwnReviews(value);
   if(!(value as Record<string,unknown>[]).every(v=>v.testEntry===true)) throw new ReviewGatewayError('unavailable');
   return rows.map(row=>({...row,testEntry:true}));
 }
 async mine(signal?:AbortSignal) { return this.reviews(await this.rpc('my_reviews',{},signal)); }
 async queue(signal?:AbortSignal) { return this.reviews(await this.rpc('queue',{},signal)); }
 private validate(version:number,requestId:string,zero=false) { if(!Number.isInteger(version)||version<(zero?0:1)||!isUuid(requestId))throw new ReviewGatewayError('invalid'); }
 async prepareProfile(version:number,requestId:string) {
   this.validate(version,requestId,true);
   const result=await this.rpc('prepare_profile',{expected_version:version,request_id:requestId},undefined,true);
   if(!record(result)||result.status!=='saved'||result.version!==version+1||result.requestId!==requestId) throw new ReviewGatewayError('unconfirmed');
 }
 async submit(restaurantId:string,profileVersion:number,requestId:string) {
   this.validate(profileVersion,requestId);if(!isUuid(restaurantId))throw new ReviewGatewayError('invalid');
   const result=await this.rpc('submit',{restaurant_id:restaurantId,expected_profile_version:profileVersion,request_id:requestId},undefined,true);
   if(!record(result)||!isUuid(result.id)||result.status!=='pending'||result.version!==1||result.testEntry!==true||result.requestId!==requestId)throw new ReviewGatewayError('unconfirmed');
 }
 async withdraw(id:string,version:number,requestId:string) {
   this.validate(version,requestId);if(!isUuid(id))throw new ReviewGatewayError('invalid');
   const result=await this.rpc('withdraw',{review_id:id,expected_version:version,request_id:requestId},undefined,true);
   if(!record(result)||result.id!==id||result.status!=='withdrawn'||result.requestId!==requestId||!(result.version===version+1||(result.version===version&&result.changed===false)))throw new ReviewGatewayError('unconfirmed');
 }
 async deleteProfile(version:number,requestId:string) {
   this.validate(version,requestId);
   const result=await this.rpc('delete_profile',{expected_version:version,request_id:requestId},undefined,true);
   if(!record(result)||result.status!=='deleted'||result.requestId!==requestId)throw new ReviewGatewayError('unconfirmed');
 }
}
