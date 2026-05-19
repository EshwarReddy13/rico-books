export type AiCategorizationProposal = {
  transactionId: string;
  mainCategoryId: string | null;
  subCategoryId: string | null;
  description: string;
  confidence: number;
};

export type AiCategorizationResponse = {
  proposals: AiCategorizationProposal[];
};
