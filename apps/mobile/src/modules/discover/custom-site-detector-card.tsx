import { useAtom } from "jotai"
import type { FC } from "react"
import { useEffect, useState } from "react"
import { ActivityIndicator, Image, Pressable, View } from "react-native"

import { customCategoriesAtom, customPostsAtom, customSitesAtom } from "@/src/atoms/custom-sites"
import { Text } from "@/src/components/ui/typography/Text"
import { CheckFilledIcon } from "@/src/icons/check_filled"
import { Rss2CuteFiIcon } from "@/src/icons/rss_2_cute_fi"
import { World2CuteReIcon } from "@/src/icons/world_2_cute_re"
import { detectCustomSite } from "@/src/services/site-scraper/detector"
import type { SiteDetectionResult } from "@/src/services/site-scraper/types"
import { useColor } from "@/src/theme/colors"

export const CustomSiteDetectorCard: FC<{
  keyword: string
}> = ({ keyword }) => {
  const [customSites, setCustomSites] = useAtom(customSitesAtom)
  const [, setCustomCategories] = useAtom(customCategoriesAtom)
  const [, setCustomPosts] = useAtom(customPostsAtom)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SiteDetectionResult | null>(null)
  const primaryColor = useColor("accent")
  const secondaryLabelColor = useColor("secondaryLabel")

  const cleanKeyword = keyword.trim().toLowerCase()
  const isPotentialUrl =
    cleanKeyword.includes(".") &&
    !cleanKeyword.includes(" ") &&
    cleanKeyword.length >= 4 &&
    /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/i.test(cleanKeyword)

  useEffect(() => {
    if (!isPotentialUrl) {
      setResult(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setResult(null)

    const timer = setTimeout(async () => {
      try {
        const detectRes = await detectCustomSite(cleanKeyword)
        if (isMounted) {
          setResult(detectRes)
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setLoading(false)
        }
      }
    }, 600)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [cleanKeyword, isPotentialUrl])

  if (!isPotentialUrl) return null

  if (loading) {
    return (
      <View className="mx-4 my-3 flex-row items-center gap-3 rounded-2xl border border-opaque-separator/40 bg-secondary-system-background p-4">
        <ActivityIndicator color={primaryColor} size="small" />
        <View className="flex-1">
          <Text className="text-[14px] font-medium text-label">
            Đang kiểm tra nguồn cấp website...
          </Text>
          <Text className="text-[12px] text-secondary-label" numberOfLines={1}>
            {cleanKeyword}
          </Text>
        </View>
      </View>
    )
  }

  if (!result || !result.success || !result.site) return null

  const { site, categories = [], initialPosts = [] } = result
  const isAlreadySubscribed = customSites.some((s) => s.id === site.id || s.url === site.url)

  const handleSubscribe = () => {
    if (isAlreadySubscribed) return

    setCustomSites((prev) => [site, ...prev])

    if (categories.length > 0) {
      setCustomCategories((prev) => ({
        ...prev,
        [site.id]: categories,
      }))
    }

    if (initialPosts.length > 0) {
      setCustomPosts((prev) => ({
        ...prev,
        [site.id]: initialPosts,
      }))
    }
  }

  return (
    <View className="mx-4 my-3 rounded-2xl border border-opaque-separator/60 bg-secondary-system-background p-4 shadow-sm">
      <View className="flex-row items-center gap-3">
        {site.favicon ? (
          <Image
            source={{ uri: site.favicon }}
            className="size-10 rounded-xl bg-quaternary-system-fill"
            resizeMode="cover"
          />
        ) : (
          <View className="size-10 items-center justify-center rounded-xl bg-quaternary-system-fill">
            <World2CuteReIcon width={22} height={22} color={primaryColor} />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[16px] font-semibold text-label" numberOfLines={1}>
              {site.name}
            </Text>
            <View className="rounded-md bg-accent/15 px-1.5 py-0.5">
              <Text className="text-[10px] font-medium text-accent uppercase">
                {site.type === "wordpress" ? "WordPress" : "RSS Feed"}
              </Text>
            </View>
          </View>

          <Text className="text-[12px] text-secondary-label" numberOfLines={1}>
            {site.url}
          </Text>
        </View>
      </View>

      <View className="mt-2.5 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1">
          <Rss2CuteFiIcon width={14} height={14} color={secondaryLabelColor} />
          <Text className="text-[12px] text-secondary-label">
            {categories.length > 0 ? `${categories.length} danh mục` : "Toàn bộ bài viết"}
          </Text>
        </View>

        {site.postCount ? (
          <Text className="text-[12px] text-secondary-label">
            • {site.postCount} bài viết
          </Text>
        ) : null}
      </View>

      {site.description ? (
        <Text className="mt-2 text-[13px] text-secondary-label" numberOfLines={2}>
          {site.description}
        </Text>
      ) : null}

      <Pressable
        onPress={handleSubscribe}
        disabled={isAlreadySubscribed}
        className={`mt-3.5 flex-row items-center justify-center gap-2 rounded-xl py-2.5 ${
          isAlreadySubscribed
            ? "border border-opaque-separator/50 bg-quaternary-system-fill"
            : "bg-accent active:opacity-80"
        }`}
      >
        {isAlreadySubscribed ? (
          <>
            <CheckFilledIcon width={16} height={16} color={secondaryLabelColor} />
            <Text className="text-[14px] font-semibold text-secondary-label">
              Đã theo dõi website
            </Text>
          </>
        ) : (
          <Text className="text-[14px] font-semibold text-white">
            + Theo dõi website này
          </Text>
        )}
      </Pressable>
    </View>
  )
}
