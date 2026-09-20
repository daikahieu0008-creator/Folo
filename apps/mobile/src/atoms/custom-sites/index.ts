import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { JotaiPersistSyncStorage } from "@/src/lib/jotai"
import type { SiteCategory, SiteMetadata, SitePost } from "@/src/services/site-scraper/types"

// Persistent list of custom sites
export const customSitesAtom = atomWithStorage<SiteMetadata[]>(
  "custom_sites_list_v1",
  [],
  JotaiPersistSyncStorage,
)

// Persistent categories per site: Record<siteId, SiteCategory[]>
export const customCategoriesAtom = atomWithStorage<Record<string, SiteCategory[]>>(
  "custom_site_categories_v1",
  {},
  JotaiPersistSyncStorage,
)

// Persistent posts: Record<string, SitePost[]> where key is `${siteId}_${categoryId}` or siteId
export const customPostsAtom = atomWithStorage<Record<string, SitePost[]>>(
  "custom_site_posts_v1",
  {},
  JotaiPersistSyncStorage,
)

// Hidden post IDs: string[]
export const hiddenPostIdsAtom = atomWithStorage<string[]>(
  "custom_site_hidden_posts_v1",
  [],
  JotaiPersistSyncStorage,
)

// Custom prompts per site: Record<siteId, string>
export const siteCustomPromptsAtom = atomWithStorage<Record<string, string>>(
  "custom_site_prompts_v1",
  {},
  JotaiPersistSyncStorage,
)

// Downloading state in memory
export const downloadProgressAtom = atom<Record<string, { current: number; total: number; isDownloading: boolean }>>({})
