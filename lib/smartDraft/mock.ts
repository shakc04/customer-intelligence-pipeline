import type { SmartDraftProvider, DraftInput, DraftOutput } from "./types";

/**
 * Template-based mock provider. No external API required.
 * Produces personalized subject/body when sku and/or eventType are present.
 */
export class MockSmartDraftProvider implements SmartDraftProvider {
  async generate(input: DraftInput): Promise<DraftOutput> {
    const { customerEmail, recentEventType, recommendedSku } = input;
    const firstName = customerEmail.split("@")[0];
    const activity = recentEventType
      ? formatEventType(recentEventType)
      : "recently visited us";

    if (recommendedSku && recentEventType) {
      return {
        subject: `Still thinking about ${recommendedSku}?`,
        body: `Hi ${firstName},\n\nWe noticed you ${activity} and showed interest in ${recommendedSku}. Don't let it get away!\n\nShop now →`,
      };
    }

    if (recommendedSku) {
      return {
        subject: `Still thinking about ${recommendedSku}?`,
        body: `Hi ${firstName},\n\nWe think ${recommendedSku} would be perfect for you. Grab it before it's gone!\n\nShop now →`,
      };
    }

    if (recentEventType) {
      return {
        subject: `We have something special for you`,
        body: `Hi ${firstName},\n\nThank you for ${activity}. We'd love to help you find what you're looking for.\n\nExplore our latest →`,
      };
    }

    return {
      subject: `We have something special for you`,
      body: `Hi ${firstName},\n\nWe'd love to reconnect and share our latest offerings with you.\n\nExplore now →`,
    };
  }
}

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, " ");
}
