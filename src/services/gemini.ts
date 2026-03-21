import { GoogleGenAI } from '@google/genai';
import type { Restaurant, Review, AIAnalysis, AIAccessGuide } from '../types';

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');
  return new GoogleGenAI({ apiKey });
};

export async function analyzeRestaurantForBusiness(
  restaurant: Restaurant,
  reviews: Review[]
): Promise<AIAnalysis> {
  const client = getClient();

  const reviewText = reviews
    .map(
      (r, i) =>
        `口コミ${i + 1}（${r.authorRole}）: ${r.comment} | 個室詳細: ${r.privateRoomDetail} | 利用シーン: ${r.occasion}`
    )
    .join('\n');

  const prompt = `あなたは高級会食・接待のコンサルタントです。以下の情報をもとに、この店が「重要な商談」や「役員接待」に向いているか、機密性・ホスピタリティ・格式の観点で総合的に分析してください。

【店舗情報】
店名: ${restaurant.name}
ジャンル: ${restaurant.genre}
エリア: ${restaurant.area}
個室タイプ: ${restaurant.privateRoomType}
個室詳細: ${restaurant.privateRoomDetail}
価格帯: ${restaurant.priceRange}
ドレスコード: ${restaurant.dressCode}

【ビジネス評価スコア（1-5）】
接客の洗練さ: ${restaurant.businessSpecs.serviceQuality}
静かさ: ${restaurant.businessSpecs.quietness}
アクセス: ${restaurant.businessSpecs.accessEase}
機密性: ${restaurant.businessSpecs.confidentiality}
雰囲気・格式: ${restaurant.businessSpecs.ambiance}

【実際の口コミ】
${reviewText || '（口コミなし）'}

以下のJSON形式で回答してください:
{
  "businessScore": (0-100の整数),
  "summary": "2〜3文の総評",
  "pros": ["強み1", "強み2", "強み3"],
  "cons": ["弱点1", "弱点2"],
  "recommendedScenes": ["推奨シーン1", "推奨シーン2", "推奨シーン3"],
  "confidentialityNote": "機密性に関する具体的なコメント",
  "executiveSuitability": "最適 または 適切 または 条件付き または 不適"
}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format from Gemini');

  return JSON.parse(jsonMatch[0]) as AIAnalysis;
}

export async function getAccessGuide(restaurant: Restaurant): Promise<AIAccessGuide> {
  const client = getClient();

  const prompt = `あなたはビジネスマン向けのアクセスガイドの専門家です。以下の店舗情報をもとに、ビジネスマンが迷わず到着できるよう、最寄り駅の具体的な出口・徒歩ルート、タクシー・ハイヤーの利用アドバイスを提供してください。

【店舗情報】
店名: ${restaurant.name}
住所: ${restaurant.address}
最寄り駅: ${restaurant.nearestStation}
タクシーの捕まえやすさ: ${restaurant.taxiEase}/5

以下のJSON形式で回答してください:
{
  "nearestStations": [
    {
      "name": "駅名",
      "line": "路線名",
      "exit": "具体的な出口番号と方向",
      "walkTime": 徒歩分数
    }
  ],
  "taxiAdvice": "タクシー・ハイヤー利用に関する具体的なアドバイス",
  "driverInstruction": "タクシー運転手への具体的な案内指示文",
  "accessNote": "その他のアクセスに関する重要情報"
}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format from Gemini');

  return JSON.parse(jsonMatch[0]) as AIAccessGuide;
}
