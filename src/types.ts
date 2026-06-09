export interface GenerationResponse {
  imageUrl?: string;
  error?: string;
}

export const HISTORICAL_SCENES = [
  { id: '1920s', name: '1920s Speakeasy', prompt: '1920s speakeasy party, wearing vintage flapper or gangster attire' },
  { id: 'rome', name: 'Ancient Rome', prompt: 'Ancient Rome, wearing a traditional toga or gladiator armor' },
  { id: 'renaissance', name: 'Renaissance', prompt: '16th-century Renaissance Italy, wearing elegant noble attire' },
  { id: 'victorian', name: 'Victorian Era', prompt: 'Victorian Era London, wearing a top hat or elegant corseted dress' },
  { id: 'medieval', name: 'Medieval Knight', prompt: 'Medieval battlefield or castle, wearing shining knight armor' },
  { id: 'egypt', name: 'Ancient Egypt', prompt: 'Ancient Egypt alongside pharaohs, wearing elaborate royalty garments' }
] as const;

export type HistoricalSceneId = typeof HISTORICAL_SCENES[number]['id'];
