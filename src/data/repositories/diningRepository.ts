import { decodePublishedCatalog } from '../../domain/dining.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EditorialRestaurant, FactField, VerifiedRestaurant, VerificationStatus } from '../../domain/dining.ts';

export interface DiningRepository {
  listPublished(signal?: AbortSignal): Promise<VerifiedRestaurant[]>;
  canEdit(signal?: AbortSignal): Promise<boolean>;
  listEditorial(signal?: AbortSignal): Promise<EditorialRestaurant[]>;
  recordFact(id: string, expectedVersion: number, field: FactField, value: string, officialUrl: string): Promise<void>;
  moderate(id: string, expectedVersion: number, status: VerificationStatus, reason: string): Promise<void>;
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
  async listPublished(signal?: AbortSignal) {
    const rows = await this.rpc<VerifiedRestaurant[]>('dining_public_catalog', {}, signal);
    return decodePublishedCatalog(rows);
  }
  canEdit(signal?: AbortSignal) { return this.rpc<boolean>('dining_editor_access', {}, signal); }
  listEditorial(signal?: AbortSignal) { return this.rpc<EditorialRestaurant[]>('dining_editor_queue', {}, signal); }
  async recordFact(id: string, expectedVersion: number, field: FactField, value: string, officialUrl: string) {
    await this.rpc('dining_record_official_fact', { restaurant_id: id, expected_version: expectedVersion, fact_field: field, fact_value: value, official_url: officialUrl });
  }
  async moderate(id: string, expectedVersion: number, status: VerificationStatus, reason: string) {
    await this.rpc('dining_moderate_restaurant', { restaurant_id: id, expected_version: expectedVersion, next_status: status, reason });
  }
}
