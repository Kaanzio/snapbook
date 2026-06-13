if (typeof window !== 'undefined') {
  // Turbopack / Next.js client-side environments sometimes don't polyfill process.env
  // Transformers.js / onnxruntime-web accesses Object.keys(process.env) and throws "Cannot convert undefined or null to object"
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
}

export {};
