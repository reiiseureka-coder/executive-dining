import { decodePublishedCatalog } from '../../domain/dining.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EditorialRestaurant, FactField, VerifiedRestaurant, VerificationStatus } from '../../domain/dining.ts';

export interface EditorialContext { contractVersion: 1; publicEnabled: boolean; reviewsEnabled: boolean; manualIntakeEnabled: boolean; queueLimit: number }
export interface DiningRepository {
  editorContext(signal?: AbortSignal): Promise<EditorialContext>;
  createCandidate(name: string, address: string, website: string, requestId: string): Promise<string>;
  listPublished(signal?: AbortSignal): Promise<VerifiedRestaurant[]>;
  canEdit(signal?: AbortSignal): Promise<boolean>;
  listEditorial(signal?: AbortSignal): Promise<EditorialRestaurant[]>;
  recordFact(id: string, expectedVersion: number, field: FactField, value: string, officialUrl: string): Promise<void>;
  moderate(id: string, expectedVersion: number, status: VerificationStatus, reason: string, expectedPublicEnabled: boolean): Promise<void>;
}
export class SupabaseDiningRepository implements DiningRepository {
  private client: SupabaseClient;
  constructor(client: SupabaseClient) { this.client = client; }
  private async rpc<T>(name: string, args: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
    const request = this.client.rpc(name, args);
    const { data, error } = await (signal ? request.abortSignal(signal) : request);
    if (error) throw new Error('データを取得・更新できませんでした。権限、接続、またはデータの変更をご確認ください。');
    return data as T;
  }
  async editorContext(signal?: AbortSignal): Promise<EditorialContext> {
    const value = await this.rpc<EditorialContext>('dining_editor_context', {}, signal);
    if (!value || value.contractVersion !== 1 || typeof value.publicEnabled !== 'boolean' || typeof value.reviewsEnabled !== 'boolean' || typeof value.manualIntakeEnabled !== 'boolean' || value.queueLimit !== 200) throw new Error('管理設定の形式を確認できません。');
    return value;
  }
  async createCandidate(name: string, address: string, website: string, requestId: string) {
    const value = await this.rpc<{id: string}>('dining_create_candidate', { candidate_name: name.trim(), candidate_address: address.trim(), official_url: website.trim(), request_id: requestId });
    if (!value || typeof value.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(value.id)) throw new Error('追加結果を確認できません。');
    return value.id;
  }
  async listPublished(signal?: AbortSignal) {
    const rows = await this.rpc<VerifiedRestaurant[]>('dining_public_catalog', {}, signal);
    return decodePublishedCatalog(rows);
  }
  canEdit(signal?: AbortSignal) { return this.rpc<boolean>('dining_editor_access', {}, signal); }
  listEditorial(signal?: AbortSignal) { return this.rpc<EditorialRestaurant[]>('dining_editor_queue', {}, signal); }
  async recordFact(id: string, expectedVersion: number, field: FactField, value: string, officialUrl: string) {
    await this.rpc('dining_record_official_fact', { restaurant_id: id, expected_version: expectedVersion, fact_field: field, fact_value: value, official_url: officialUrl });
  }
  async moderate(id: string, expectedVersion: number, status: VerificationStatus, reason: string, expectedPublicEnabled: boolean) {
    await this.rpc('dining_save_listing_decision', { restaurant_id: id, expected_version: expectedVersion, next_status: status, reason, expected_public_enabled: expectedPublicEnabled });
  }
}
