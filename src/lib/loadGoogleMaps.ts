let mapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();

  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("#gmaps-script");
      if (existing) {
        existing.onload = () => resolve();
        existing.onerror = (e) => reject(e);
        return;
      }
      const s = document.createElement("script");
      s.id = "gmaps-script";
      s.async = true;
      s.defer = true;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }
  return mapsPromise;
}
