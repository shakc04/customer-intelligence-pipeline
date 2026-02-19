import type { SmartDraftProvider, DraftInput, DraftOutput } from "./types";
import { MockSmartDraftProvider } from "./mock";

let provider: SmartDraftProvider = new MockSmartDraftProvider();

export function setSmartDraftProvider(p: SmartDraftProvider) {
  provider = p;
}

export async function smartGenerateDraft(
  input: DraftInput
): Promise<DraftOutput> {
  return provider.generate(input);
}
