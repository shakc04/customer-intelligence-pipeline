import type { SegmentDefinition } from "@/lib/segments";

export interface SmartGenerateProvider {
  generate(prompt: string): Promise<SegmentDefinition>;
}
