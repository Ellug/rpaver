declare global {
  interface CharacterDetail {
    id?: string;
    birth?: string;
    body?: string;
    brother?: string;
    child?: string;
    country?: string;
    detail?: string;
    family?: string;
    familyRelation?: string;
    gender?: string;
    hobby?: string;
    marriage?: string;
    name?: string;
    parent?: string;
    party?: string;
    personality?: string;
    series?: string;
    skill?: string;
    talent?: string;
    title?: string;
    unit?: string;
    voice?: string;
    weapon?: string;
    imageUrl?: string;
  }

  type Character = {
    id: string;
    birth: string;
    name: string;
    family: string;
    title: string;
    gender: string;
    unit: string;
    party: string;
    skill: string;
    body: string;
  };

  interface SearchCategory {
    name: string;
    value: string;
  }

  export interface HistoryDocType {
    id: number;
    date: string;
    title: string;
    content: string;
    updatedAt: string;
    createdAt: string;
  }
  

  type HighlightFunction = (text: string | undefined) => string;
}

export {};
