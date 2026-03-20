
import { GoogleGenAI, Type } from "@google/genai";
import { Review, BusinessAnalysis, NearbyInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRestaurantForBusiness = async (restaurantName: string, reviews: Review[]): Promise<BusinessAnalysis | null> => {
  if (!process.env.API_KEY) return null;

  const reviewText = reviews.map(r => `[Rating: ${r.rating}, Service: ${r.serviceQuality}, Comment: ${r.comment}]`).join("\n");
  
  const prompt = `
    あなたは高級会食・接待のコンサルタントです。
    以下の飲食店「${restaurantName}」に対するユーザーの口コミを分析し、ビジネス利用（接待・会食）における適性を評価してください。
    
    口コミデータ:
    ${reviewText}
    
    以下の項目を含むJSONで回答してください：
    - suitabilityScore: ビジネス利用適性スコア (0-100)
    - reasoning: なぜそのスコアなのかの簡潔な理由
    - pros: ビジネス利用におけるメリット (最大3つ)
    - cons: ビジネス利用における注意点・デメリット (最大2つ)
    - bestUseCases: 最適な利用シーン（例：重要な商談、社内親睦会、カジュアルな接待など）
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suitabilityScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            bestUseCases: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr) as BusinessAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const getNearbyInfo = async (restaurantName: string, address: string): Promise<NearbyInfo | null> => {
  if (!process.env.API_KEY) return null;

  const prompt = `
    飲食店「${restaurantName}」（住所: ${address}）の最寄り駅情報を教えてください。
    1. 最も近い駅名と、出口番号、そこからの徒歩分数を具体的に教えてください。
    2. 接待で利用しやすいタクシー乗り場や、ハイヤーが停めやすい場所の情報があれば含めてください。
    
    回答はビジネスマンに役立つ簡潔なものにしてください。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.maps)
      ?.map((chunk: any) => ({
        title: chunk.maps.title,
        uri: chunk.maps.uri
      })) || [];

    // Extract a simple station summary from the text if possible
    const text = response.text || "";
    const stationMatch = text.match(/.*駅から徒歩[0-9]+分/);
    const stationInfo = stationMatch ? stationMatch[0] : "AIが詳細を解析中...";

    return {
      text: text,
      stationInfo: stationInfo,
      links: links
    };
  } catch (error) {
    console.error("Gemini Maps Error:", error);
    return null;
  }
};
