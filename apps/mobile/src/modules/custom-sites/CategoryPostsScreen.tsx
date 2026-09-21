import { useAtom } from "jotai"
import type { FC } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  View,
} from "react-native"

import { customPostsAtom, hiddenPostIdsAtom } from "@/src/atoms/custom-sites"
import { NavigationHeaderView } from "@/src/components/layouts/views/NavigationHeaderView"
import { Text } from "@/src/components/ui/typography/Text"
import { ArrowLeftCuteReIcon } from "@/src/icons/arrow_left_cute_re"
import { CheckFilledIcon } from "@/src/icons/check_filled"
import { Download2CuteFiIcon } from "@/src/icons/download_2_cute_fi"
import { Eye2CuteReIcon } from "@/src/icons/eye_2_cute_re"
import { EyeCloseCuteReIcon } from "@/src/icons/eye_close_cute_re"
import { Refresh2CuteReIcon } from "@/src/icons/refresh_2_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { SiteCategory, SiteMetadata, SitePost } from "@/src/services/site-scraper/types"
import {
  fetchAllWordPressPostsForCategory,
  fetchWordPressPostsByCategory,
} from "@/src/services/site-scraper/wordpress"
import { useColor } from "@/src/theme/colors"

import { PostDetailScreen } from "./PostDetailScreen"

export const CategoryPostsScreen: FC<{
  site: SiteMetadata
  category: SiteCategory
}> = ({ site, category }) => {
  const navigation = useNavigation()
  const labelColor = useColor("label")
  const secondaryLabelColor = useColor("secondaryLabel")
  const primaryColor = useColor("accent")

  const [allPostsMap, setAllPostsMap] = useAtom(customPostsAtom)
  const [hiddenPostIds, setHiddenPostIds] = useAtom(hiddenPostIdsAtom)

  // Posts key for this category
  const categoryKey = `${site.id}_${category.id}`
  const cachedPosts = allPostsMap[categoryKey] || []

  const [posts, setPosts] = useState<SitePost[]>(cachedPosts)
  const [loading, setLoading] = useState(cachedPosts.length === 0)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    isDownloading: boolean
    current: number
    total: number
  }>({
    isDownloading: false,
    current: 0,
    total: 0,
  })
  const [showHiddenOnly, setShowHiddenOnly] = useState(false)

  // Initial load if not yet loaded
  useEffect(() => {
    if (cachedPosts.length > 0) {
      setPosts(cachedPosts)
      return
    }

    let isMounted = true
    setLoading(true)

    if (site.type === "wordpress") {
      fetchWordPressPostsByCategory(site.id, site.url, category.id, category.name, 1, 30)
        .then((res) => {
          if (isMounted) {
            setPosts(res.posts)
            setAllPostsMap((prev) => ({
              ...prev,
              [categoryKey]: res.posts,
            }))
            setLoading(false)
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false)
        })
    } else {
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [category.id, category.name, categoryKey, cachedPosts.length, setAllPostsMap, site.id, site.type, site.url])

  // Refresh: fetch new posts, do not reload old ones
  const handleRefresh = async () => {
    if (refreshing || downloadProgress.isDownloading) return
    setRefreshing(true)

    try {
      if (site.type === "wordpress") {
        const res = await fetchWordPressPostsByCategory(
          site.id,
          site.url,
          category.id,
          category.name,
          1,
          50,
        )

        const existingIds = new Set(posts.map((p) => String(p.id)))
        const newPosts = res.posts.filter((p) => !existingIds.has(String(p.id)))

        const updatedList = [...newPosts, ...posts]
        setPosts(updatedList)
        setAllPostsMap((prev) => ({
          ...prev,
          [categoryKey]: updatedList,
        }))
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false)
    }
  }

  // Download all posts in this category for offline reading
  const handleDownloadAll = async () => {
    if (downloadProgress.isDownloading) return

    setDownloadProgress({
      isDownloading: true,
      current: 0,
      total: category.count || posts.length || 0,
    })

    try {
      if (site.type === "wordpress") {
        const allFetchedPosts = await fetchAllWordPressPostsForCategory(
          site.id,
          site.url,
          category.id,
          category.name,
          (current, total) => {
            setDownloadProgress({
              isDownloading: true,
              current,
              total,
            })
          },
        )

        // Mark all as downloaded
        const downloadedPosts = allFetchedPosts.map((p) => ({
          ...p,
          isDownloaded: true,
        }))

        setPosts(downloadedPosts)
        setAllPostsMap((prev) => ({
          ...prev,
          [categoryKey]: downloadedPosts,
        }))
      }
    } catch {
      // ignore
    } finally {
      setDownloadProgress({
        isDownloading: false,
        current: 0,
        total: 0,
      })
    }
  }

  // Toggle hide post
  const handleToggleHidePost = (postId: string | number) => {
    const idStr = String(postId)
    setHiddenPostIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr],
    )
  }

  // Filtered posts based on hidden status
  const visiblePosts = useMemo(() => {
    return posts.filter((p) => {
      const isHidden = hiddenPostIds.includes(String(p.id))
      return showHiddenOnly ? isHidden : !isHidden
    })
  }, [posts, hiddenPostIds, showHiddenOnly])

  const hiddenCount = useMemo(() => {
    return posts.filter((p) => hiddenPostIds.includes(String(p.id))).length
  }, [posts, hiddenPostIds])

  const allDownloaded = posts.length > 0 && posts.every((p) => p.isDownloaded)

  const handleOpenPost = (post: SitePost) => {
    navigation.pushControllerView(PostDetailScreen, { site, post })
  }

  return (
    <View className="flex-1 bg-system-background">
      <NavigationHeaderView
        title={category.name}
        leftContent={
          <Pressable
            onPress={() => navigation.back()}
            className="p-2 active:opacity-70"
            hitSlop={10}
          >
            <ArrowLeftCuteReIcon width={20} height={20} color={labelColor} />
          </Pressable>
        }
        rightContent={
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={handleRefresh}
              disabled={refreshing || downloadProgress.isDownloading}
              className="p-2 active:opacity-70"
              hitSlop={10}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <Refresh2CuteReIcon width={19} height={19} color={labelColor} />
              )}
            </Pressable>
          </View>
        }
      />

      {/* Action Bar: Download all & Hide toggles */}
      <View className="border-b border-opaque-separator/40 bg-secondary-system-background px-4 py-2.5">
        <View className="flex-row items-center justify-between gap-3">
          {/* Download button / progress */}
          <Pressable
            onPress={handleDownloadAll}
            disabled={downloadProgress.isDownloading || allDownloaded}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2 px-3 ${
              allDownloaded
                ? "bg-green-500/15 border border-green-500/30"
                : downloadProgress.isDownloading
                ? "bg-accent/20"
                : "bg-accent active:opacity-80"
            }`}
          >
            {downloadProgress.isDownloading ? (
              <>
                <ActivityIndicator size="small" color={primaryColor} />
                <Text className="text-[13px] font-semibold text-accent">
                  Đang tải {downloadProgress.current}/{downloadProgress.total} bài...
                </Text>
              </>
            ) : allDownloaded ? (
              <>
                <CheckFilledIcon width={15} height={15} color="#22C55E" />
                <Text className="text-[13px] font-semibold text-green-600 dark:text-green-400">
                  Đã tải toàn bộ ({posts.length} bài)
                </Text>
              </>
            ) : (
              <>
                <Download2CuteFiIcon width={15} height={15} color="#FFFFFF" />
                <Text className="text-[13px] font-semibold text-white">
                  Tải về toàn bộ danh mục ({category.count || posts.length} bài)
                </Text>
              </>
            )}
          </Pressable>

          {/* Toggle hidden posts button */}
          {hiddenCount > 0 ? (
            <Pressable
              onPress={() => setShowHiddenOnly((prev) => !prev)}
              className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 ${
                showHiddenOnly
                  ? "border-accent bg-accent/15"
                  : "border-opaque-separator/50 bg-quaternary-system-fill active:opacity-70"
              }`}
            >
              {showHiddenOnly ? (
                <Eye2CuteReIcon width={15} height={15} color={primaryColor} />
              ) : (
                <EyeCloseCuteReIcon width={15} height={15} color={secondaryLabelColor} />
              )}
              <Text
                className={`text-[12px] font-medium ${
                  showHiddenOnly ? "text-accent" : "text-secondary-label"
                }`}
              >
                {showHiddenOnly ? "Hiện tất cả" : `Bài ẩn (${hiddenCount})`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Posts List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-3 text-[14px] text-secondary-label">
            Đang nạp bài viết từ "{category.name}"...
          </Text>
        </View>
      ) : visiblePosts.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-[15px] text-secondary-label">
            {showHiddenOnly
              ? "Không có bài viết nào bị ẩn."
              : "Không có bài viết nào trong danh mục này."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visiblePosts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const isHidden = hiddenPostIds.includes(String(item.id))
            return (
              <Pressable
                onPress={() => handleOpenPost(item)}
                className="mb-3.5 overflow-hidden rounded-2xl border border-opaque-separator/50 bg-secondary-system-background active:opacity-80"
              >
                {item.featuredMedia ? (
                  <Image
                    source={{ uri: item.featuredMedia }}
                    className="h-44 w-full bg-quaternary-system-fill"
                    resizeMode="cover"
                  />
                ) : null}

                <View className="p-3.5">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 text-[16px] font-bold text-label" numberOfLines={2}>
                      {item.title}
                    </Text>

                    {/* Nút Ẩn / Bỏ ẩn bài viết */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.()
                        handleToggleHidePost(item.id)
                      }}
                      className="rounded-full bg-quaternary-system-fill p-2 active:opacity-60"
                      hitSlop={8}
                    >
                      {isHidden ? (
                        <Eye2CuteReIcon width={16} height={16} color={primaryColor} />
                      ) : (
                        <EyeCloseCuteReIcon width={16} height={16} color={secondaryLabelColor} />
                      )}
                    </Pressable>
                  </View>

                  {item.excerpt ? (
                    <Text
                      className="mt-1.5 text-[13px] leading-5 text-secondary-label"
                      numberOfLines={2}
                    >
                      {item.excerpt}
                    </Text>
                  ) : null}

                  <View className="mt-3 flex-row items-center justify-between border-t border-opaque-separator/30 pt-2.5">
                    <Text className="text-[12px] text-secondary-label">
                      {item.date ? item.date.slice(0, 10) : ""}
                    </Text>

                    {item.isDownloaded ? (
                      <View className="flex-row items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5">
                        <CheckFilledIcon width={11} height={11} color="#22C55E" />
                        <Text className="text-[10px] font-medium text-green-600 dark:text-green-400">
                          Offline
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </View>
  )
}

CategoryPostsScreen.displayName = "CategoryPostsScreen"
