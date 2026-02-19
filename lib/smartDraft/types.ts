export interface DraftInput {
  customerEmail: string;
  recentEventType?: string;
  recommendedSku?: string | null;
}

export interface DraftOutput {
  subject: string;
  body: string;
}

export interface SmartDraftProvider {
  generate(input: DraftInput): Promise<DraftOutput>;
}
