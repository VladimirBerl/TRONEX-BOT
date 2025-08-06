export type TaskDraft = {
  step: 'title' | 'reward' | 'url' | 'image';
  title: string;
  reward: string;
  url: string;
  imageFileId: string;
  imageUrl: string;
};