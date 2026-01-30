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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.warn(`Failed to extract metadata for ${url}:`, error.message);
      return {};
    }
  }
}
