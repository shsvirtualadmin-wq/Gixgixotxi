import React, { createContext, useContext, useState, useEffect } from 'react';

interface SiteSettingsContextType {
  logoUrl: string | null;
  refreshSiteSettings: () => Promise<void>;
}

const NEW_BOARDLY_LOGO_URL = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/logo_clean_square.png';

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  logoUrl: NEW_BOARDLY_LOGO_URL,
  refreshSiteSettings: async () => {},
});

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl] = useState<string | null>(NEW_BOARDLY_LOGO_URL);

  // Maintain favicon setting
  useEffect(() => {
    try {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = NEW_BOARDLY_LOGO_URL;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = NEW_BOARDLY_LOGO_URL;
        document.head.appendChild(newLink);
      }
    } catch (e) {
      console.warn('Failed to update dynamic favicon:', e);
    }
  }, []);

  const refreshSiteSettings = async () => {};

  return (
    <SiteSettingsContext.Provider
      value={{
        logoUrl,
        refreshSiteSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
