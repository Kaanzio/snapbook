import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Define a class to manage the singleton instance of the classification pipeline
class PipelineFactory {
  static task = 'image-classification';
  static model = 'Xenova/mobilenet_v2_1.0_224';
  static instance: any = null;

  static async getInstance(progress_callback: Function) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task as any, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
  const { id, type, imageUrl } = event.data;

  if (type === 'classify') {
    try {
      // Load the model
      const classifier = await PipelineFactory.getInstance((data: any) => {
        self.postMessage({
          id,
          type: 'progress',
          data,
        });
      });

      // We need to fetch the image and convert it to a format Transformers.js can read
      // Since imageUrl is a blob URL or data URL from IndexedDB, we can just pass it directly
      const output = await classifier(imageUrl, { topk: 5 });

      // Output is an array like: [{ label: "tabby, tabby cat", score: 0.95 }, ...]
      // We will filter and map these to clean tags
      const tags = output
        .filter((item: any) => item.score > 0.2) // Only confident tags
        .map((item: any) => {
          // Clean up ImageNet labels (e.g. "tabby, tabby cat" -> "tabby cat")
          const cleanLabel = item.label.split(',')[0].trim().toLowerCase();
          return cleanLabel;
        });

      self.postMessage({
        id,
        type: 'complete',
        tags,
      });

    } catch (error: any) {
      console.error("AI Worker Error:", error);
      self.postMessage({
        id,
        type: 'error',
        error: error.message,
      });
    }
  }
});
