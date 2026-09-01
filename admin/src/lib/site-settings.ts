import type { CSSProperties } from "react";

export const SITE_SETTINGS_SCOPE = "site";
export const BRANDING_SETTINGS_GROUP_KEY = "branding";

export const brandingSettingKeys = [
  "siteLogoUrl",
  "adminLogoUrl",
  "defaultAvatarUrl",
  "heroImageUrl",
  "faviconUrl",
] as const;

export type BrandingSettingKey = (typeof brandingSettingKeys)[number];

export type SiteSettingRow = {
  scope: typeof SITE_SETTINGS_SCOPE;
  group_key: typeof BRANDING_SETTINGS_GROUP_KEY;
  key: BrandingSettingKey;
  value: string;
  value_type: "string";
  is_public: true;
};

export type SiteBranding = Record<BrandingSettingKey, string>;

export const brandingSettingRows: SiteSettingRow[] = [
  {
    scope: SITE_SETTINGS_SCOPE,
    group_key: BRANDING_SETTINGS_GROUP_KEY,
    key: "siteLogoUrl",
    value: "https://api.iconify.design/lucide:moon.svg?color=%2347d6e8",
    value_type: "string",
    is_public: true,
  },
  {
    scope: SITE_SETTINGS_SCOPE,
    group_key: BRANDING_SETTINGS_GROUP_KEY,
    key: "adminLogoUrl",
    value: "https://api.iconify.design/lucide:layout-dashboard.svg?color=%2347d6e8",
    value_type: "string",
    is_public: true,
  },
  {
    scope: SITE_SETTINGS_SCOPE,
    group_key: BRANDING_SETTINGS_GROUP_KEY,
    key: "defaultAvatarUrl",
    value: "https://api.dicebear.com/9.x/initials/svg?seed=Crescent%20Index%20User&backgroundColor=2d3532&textColor=f6fbf8",
    value_type: "string",
    is_public: true,
  },
  {
    scope: SITE_SETTINGS_SCOPE,
    group_key: BRANDING_SETTINGS_GROUP_KEY,
    key: "heroImageUrl",
    value: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=82",
    value_type: "string",
    is_public: true,
  },
  {
    scope: SITE_SETTINGS_SCOPE,
    group_key: BRANDING_SETTINGS_GROUP_KEY,
    key: "faviconUrl",
    value: "https://api.iconify.design/lucide:moon.svg?color=%2347d6e8",
    value_type: "string",
    is_public: true,
  },
];

export const siteBranding = resolveSiteBranding(brandingSettingRows);

export function resolveSiteBranding(rows: SiteSettingRow[]): SiteBranding {
  const branding = {} as SiteBranding;

  for (const key of brandingSettingKeys) {
    const row = rows.find((item) => item.scope === SITE_SETTINGS_SCOPE && item.group_key === BRANDING_SETTINGS_GROUP_KEY && item.key === key);
    branding[key] = row?.value ?? "";
  }

  return branding;
}

export function imageUrlStyle(url: string) {
  return { "--hero-image": `url("${url}")` } as CSSProperties;
}

export function backgroundImageStyle(url: string) {
  return { backgroundImage: `url("${url}")` } as CSSProperties;
}
