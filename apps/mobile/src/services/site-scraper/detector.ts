import type { SiteCategory, SiteDetectionResult, SiteMetadata, SitePost } from "./types"
import { detectRss, parseRssFeed } from "./rss"
import {
  detectWordPress,
  fetchWordPressCategories,
  fetchWordPressSiteInfo,
  normalizeUrl,
} from "./wordpress"

export async function detectCustomSite(rawInput: string): Promise<SiteDetectionResult> {
  const cleanInput = rawInput.trim()
  if (!cleanInput) {
    return { success: false, error: "Vui lòng nhập đường dẫn website" }
  }

  const url = normalizeUrl(cleanInput)
  let domain = ""
  try {
    domain = new URL(url).hostname
  } catch {
    return { success: false, error: "Đường dẫn không hợp lệ" }
  }

  const siteId = domain.replace(/^www\./, "").replace(/[^a-zA-Z0-9.-]/g, "_")

  // 1. First priority: Check if WordPress REST API is available
  try {
    const isWp = await detectWordPress(url)
    if (isWp) {
      const siteInfo = await fetchWordPressSiteInfo(url)
      const categories = await fetchWordPressCategories(siteId, url)
      const totalPostsCount = categories.reduce((sum, c) => sum + (c.count || 0), 0)

      const site: SiteMetadata = {
        id: siteId,
        name: siteInfo.name || domain,
        url,
        description: siteInfo.description,
        favicon: siteInfo.favicon,
        type: "wordpress",
        createdAt: Date.now(),
        categoryCount: categories.length,
        postCount: totalPostsCount,
      }

      return {
        success: true,
        site,
        categories,
      }
    }
  } catch (err: any) {
    console.warn("WordPress detection error:", err)
  }

  // 2. Second priority: Check if standard RSS/Atom feed is available
  try {
    const rssFeedUrl = await detectRss(url)
    if (rssFeedUrl) {
      const res = await fetch(rssFeedUrl)
      if (res.ok) {
        const text = await res.text()
        const parsed = parseRssFeed(siteId, text)

        const site: SiteMetadata = {
          id: siteId,
          name: parsed.title || domain,
          url,
          description: parsed.description,
          favicon: `${url}/favicon.ico`,
          type: "rss",
          createdAt: Date.now(),
          categoryCount: parsed.categories.length,
          postCount: parsed.posts.length,
        }

        return {
          success: true,
          site,
          categories: parsed.categories,
          initialPosts: parsed.posts,
        }
      }
    }
  } catch (err: any) {
    console.warn("RSS detection error:", err)
  }

  return {
    success: false,
    error: `Không tìm thấy API WordPress hoặc nguồn RSS nào từ trang web ${domain}`,
  }
}
