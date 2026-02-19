import type { SegmentDefinition } from "@/lib/segments";
import type { SmartGenerateProvider } from "./types";
import { MockSmartGenerateProvider } from "./mock";

let provider: SmartGenerateProvider = new MockSmartGenerateProvider();

export function setSmartGenerateProvider(p: SmartGenerateProvider) {
  provider = p;
}

export async function smartGenerateSegmentDefinition(
  prompt: string
): Promise<SegmentDefinition> {
  return provider.generate(prompt);
}
