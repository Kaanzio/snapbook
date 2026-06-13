const TURKISH_TAGS = [
  // Doğa, Manzara & Hava Durumu
  "doğa", "manzara", "dağ", "orman", "deniz", "okyanus", "göl", "nehir", "şelale",
  "gökyüzü", "bulut", "güneş", "ay", "yıldızlar", "gece", "gündüz", "gün batımı", "gün doğumu",
  "çöl", "kumsal", "plaj", "vadi", "kanyon", "bahar", "yaz", "sonbahar", "kış", "kar", "yağmur",
  "sis", "fırtına", "doğa yürüyüşü", "kamp", "kamp ateşi", "çadır", "yaprak", "toprak", "çimen",
  "kaya", "taş", "mağara", "buzul", "volkan", "ada", "yarımada", "sahil", "kıyı", "karlı",
  "yağmurlu", "güneşli", "bulutlu", "rüzgarlı", "soğuk", "sıcak", "don", "çiseleyen", "gökkuşağı",
  
  // Canlılar & İnsan
  "insan", "portre", "kadın", "erkek", "çocuk", "bebek", "aile", "arkadaş", "kalabalık",
  "hayvan", "kedi", "köpek", "kuş", "balık", "böcek", "kelebek", "at", "inek", "koyun",
  "vahşi yaşam", "aslan", "kaplan", "fil", "maymun", "yılan", "örümcek", "evcil hayvan",
  "çiçek", "gül", "papatya", "lale", "orkide", "ağaç", "bitki", "kaktüs", "mantar", "yosun",
  "arı", "karınca", "kurbağa", "kertenkele", "tavşan", "geyik", "ayı", "kurt", "kartal",
  "şahin", "martı", "güvercin", "papağan", "kaplumbağa", "yunus", "balina", "köpek balığı",
  "genç", "yaşlı", "öğrenci", "öğretmen", "doktor", "sporcu", "müzisyen", "sanatçı",

  // Şehir, Mimari & Araçlar
  "şehir", "sokak", "bina", "mimari", "gökdelen", "ev", "köy", "kasaba", "köprü", "yol",
  "araba", "motosiklet", "bisiklet", "otobüs", "tren", "metro", "uçak", "helikopter", "tekne",
  "gemi", "liman", "havaalanı", "istasyon", "trafik", "taksi", "sokak sanatı", "grafiti",
  "tarihi", "harabe", "cami", "kilise", "tapınak", "kale", "saray", "müze", "heykel", "anıt",
  "kamyonet", "tır", "yat", "yelkenli", "kano", "traktör", "karavan", "kaldırım", "meydan",
  "park", "bahçe", "fabrika", "dükkan", "mağaza", "avm", "pazar", "çatı", "pencere", "kapı",

  // Yiyecek, İçecek & Mutfak
  "yemek", "kahvaltı", "öğle yemeği", "akşam yemeği", "tatlı", "pasta", "çikolata", "dondurma",
  "meyve", "sebze", "elma", "portakal", "çilek", "karpuz", "salata", "çorba", "et", "tavuk",
  "balık yemeği", "pizza", "hamburger", "sandviç", "makarna", "peynir", "ekmek",
  "içecek", "su", "kahve", "çay", "meyve suyu", "şarap", "bira", "kokteyl", "kafe", "restoran",
  "kebap", "döner", "pide", "lahmacun", "sushi", "taco", "kruvasan", "kurabiye", "kek",
  "patates kızartması", "sosis", "yumurta", "zeytin", "domates", "biber", "soğan", "sarımsak",

  // Yaşam Tarzı, Teknoloji & Nesneler
  "sanat", "müzik", "konser", "festival", "dans", "tiyatro", "sinema", "kitap", "okuma",
  "teknoloji", "bilgisayar", "telefon", "kamera", "kulaklık", "saat", "televizyon", "robot",
  "moda", "kıyafet", "ayakkabı", "çanta", "takı", "makyaj", "güzellik", "saç", "gözlük",
  "spor", "futbol", "basketbol", "voleybol", "tenis", "yüzme", "koşu", "bisiklete binme",
  "jimnastik", "yoga", "fitness", "sağlık", "meditasyon", "dinlenme", "spa", "masaj",
  "gömlek", "pantolon", "şapka", "eldiven", "ceket", "mont", "elbise", "etek", "tişört",
  "kaban", "atkı", "bere", "yüzük", "kolye", "küpe", "bileklik", "parfüm", "ruj", "oje",
  "kalem", "defter", "kağıt", "dergi", "gazete", "kutu", "şişe", "bardak", "tabak", "çatal",
  "bıçak", "kaşık", "tencere", "tava", "koltuk", "yatak", "halı", "perde", "masa", "sandalye",

  // Renkler
  "kırmızı", "mavi", "yeşil", "sarı", "mor", "turuncu", "pembe", "siyah", "beyaz", "gri",
  "kahverengi", "lacivert", "turkuaz", "altın", "gümüş", "bronz", "renkli",

  // Soyut, Duygular & Konseptler
  "aşk", "romantik", "mutluluk", "sevinç", "hüzün", "yalnızlık", "korku", "heyecan", "huzur",
  "eğlence", "oyun", "parti", "kutlama", "doğum günü", "düğün", "nişan", "mezuniyet", "tatil",
  "seyahat", "macera", "keşif", "turizm", "anı", "nostalji", "vintage", "retro", "estetik",
  "minimalist", "siyah beyaz", "karanlık", "aydınlık", "gölge", "yansıma", "siluet",
  "soyut", "geometri", "doku", "desen", "odak", "bulanık", "hareket", "enerjik", "yorgun",
  "sakin", "dinamik", "neşeli", "loş", "parlak", "neon", "pastel", "kontrast", "simetri",
  "asimetri", "perspektif", "makro", "geniş açı", "portre modu", "özçekim", "selfie"
];

class AIManager {
  private classifier: any = null;
  private isInitializing: boolean = false;

  private async getClassifier() {
    if (this.classifier) return this.classifier;
    
    if (this.isInitializing) {
      // Wait for initialization to finish if it's already in progress
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.classifier;
    }

    this.isInitializing = true;
    try {
      const { pipeline, env } = await import('@huggingface/transformers');
      
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      // Use Zero-Shot Image Classification (CLIP) which allows us to pass custom Turkish tags
      // and it ranks how relevant each tag is to the image.
      this.classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {
        progress_callback: (data: any) => { }
      });
    } catch (error: any) {
      console.error("AI Initialization failed:", error);
      throw new Error("Init Hatası: " + (error.message || String(error)));
    } finally {
      this.isInitializing = false;
    }
    
    return this.classifier;
  }

  public async generateTagsForImage(photoId: string, imageUrl: string): Promise<string[]> {
    try {
      const classifier = await this.getClassifier();
      if (!classifier) {
        throw new Error('AI Classifier could not be loaded.');
      }

      // We ask the model to rank our predefined Turkish tags for this specific image
      const output = await classifier(imageUrl, TURKISH_TAGS);

      // When passing 400+ tags, the probabilities (which sum to 1.0) become very diluted.
      // Therefore, a threshold of 0.05 is too high. We use 0.005 as a baseline
      // and take the absolute top 5 tags.
      const topTags = output
        .filter((item: any) => item.score > 0.005)
        .slice(0, 5)
        .map((item: any) => item.label);

      return topTags;
    } catch (error) {
      console.error('Failed to generate tags:', error);
      throw error;
    }
  }

  public async generateCategoryForImage(imageUrl: string): Promise<string | null> {
    try {
      const classifier = await this.getClassifier();
      if (!classifier) {
        throw new Error('AI Classifier could not be loaded.');
      }

      const categoryPrompts: Record<string, string> = {
        food: "a photo of food, meal, or cooking",
        document: "a photo of a document, text, or receipt",
        inspiration: "a photo of artistic design, aesthetic, or inspiration",
        memory: "a personal photo of memories, friends, or family",
        finance: "a photo related to money, charts, or finance",
        nature: "a photo of nature, landscape, or outdoors",
        recipe: "a photo of a recipe or cooking ingredients",
        street: "a photo of a street, road, city, or urban environment",
        other: "a random photo"
      };

      const prompts = Object.values(categoryPrompts);

      // Ask the model to classify the image using the descriptive English prompts
      const output = await classifier(imageUrl, prompts);

      // Get the highest scoring label
      if (output && output.length > 0) {
        const bestMatch = output[0];
        // We use a reasonable threshold
        if (bestMatch.score > 0.05) {
           // Find which key this prompt belonged to
           const matchedKey = Object.keys(categoryPrompts).find(key => categoryPrompts[key] === bestMatch.label);
           return matchedKey || null;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to generate category:', error);
      throw error;
    }
  }

  public async analyzeImage(photoId: string, imageUrl: string): Promise<{tags: string[], category: string | null}> {
    // Run sequentially to avoid potential memory/concurrency issues with the pipeline
    const category = await this.generateCategoryForImage(imageUrl);
    const tags = await this.generateTagsForImage(photoId, imageUrl);
    return { tags, category };
  }
}

// Export a singleton instance
export const aiManager = new AIManager();
