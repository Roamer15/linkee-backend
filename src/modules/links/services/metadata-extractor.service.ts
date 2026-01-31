import { Injectable, Logger } from '@nestjs/common';
import ogs from 'open-graph-scraper';

@Injectable()
export class MetadataExtractorService {
  private readonly logger = new Logger(MetadataExtractorService.name);

  async extractMetadata(url: string): Promise<{
    title?: string;
    image?: string;
    description?: string;
  }> {
    try {
      const { result } = await ogs({ url });

      return {
        title: result.ogTitle || result.twitterTitle,
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url,
        description: result.ogDescription || result.twitterDescription,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to extract metadata for ${url}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return {};
    }
  }
}
