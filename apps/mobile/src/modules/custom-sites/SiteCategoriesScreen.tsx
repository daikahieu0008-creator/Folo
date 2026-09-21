import { useAtom, useAtomValue } from "jotai"
import type { FC } from "react"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native"

import { customCategoriesAtom, customSitesAtom } from "@/src/atoms/custom-sites"
import { NavigationHeaderView } from "@/src/components/layouts/views/NavigationHeaderView"
import { Text } from "@/src/components/ui/typography/Text"
import { ArrowLeftCuteReIcon } from "@/src/icons/arrow_left_cute_re"
import { Delete2CuteReIcon } from "@/src/icons/delete_2_cute_re"
import { MingcuteRightLineIcon } from "@/src/icons/mingcute_right_line"
import { Rss2CuteFiIcon } from "@/src/icons/rss_2_cute_fi"
import { Settings1CuteReIcon } from "@/src/icons/settings_1_cute_re"
import { World2CuteReIcon } from "@/src/icons/world_2_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { SiteCategory, SiteMetadata } from "@/src/services/site-scraper/types"
import { fetchWordPressCategories } from "@/src/services/site-scraper/wordpress"
import { useColor } from "@/src/theme/colors"

import { CategoryPostsScreen } from "./CategoryPostsScreen"
import { SitePromptSettingsScreen } from "./SitePromptSettingsScreen"

export const SiteCategoriesScreen: FC<{
  site: SiteMetadata
}> = ({ site }) => {
  const navigation = useNavigation()
  const primaryColor = useColor("accent")
  const secondaryLabelColor = useColor("secondaryLabel")
  const redColor = useColor("red")

  const [allCategories, setAllCategories] = useAtom(customCategoriesAtom)
  const [, setCustomSites] = useAtom(customSitesAtom)
  const siteCategories = allCategories[site.id] || []

  const [loading, setLoading] = useState(siteCategories.length === 0)

  useEffect(() => {
    if (siteCategories.length > 0) return

    let isMounted = true
    setLoading(true)

    if (site.type === "wordpress") {
      fetchWordPressCategories(site.id, site.url)
        .then((cats) => {
          if (isMounted) {
            setAllCategories((prev) => ({
              ...prev,
              [site.id]: cats,
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
  }, [site.id, site.type, site.url, siteCategories.length, setAllCategories])

  const handleDeleteSite = () => {
    Alert.alert(
      "Bỏ theo dõi website",
      `Bạn có chắc chắn muốn bỏ theo dõi trang "${site.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ theo dõi",
          style: "destructive",
          onPress: () => {
            setCustomSites((prev) => prev.filter((s) => s.id !== site.id))
            navigation.back()
          },
        },
      ],
    )
  }

  const handleOpenCategory = (cat: SiteCategory) => {
    navigation.pushControllerView(CategoryPostsScreen, { site, category: cat })
  }

  const handleOpenPromptSettings = () => {
    navigation.pushControllerView(SitePromptSettingsScreen, { site })
  }

  return (
    <View className="flex-1 bg-system-background">
      <NavigationHeaderView
        title={site.name}
        leftContent={
          <Pressable
            onPress={() => navigation.back()}
            className="p-2 active:opacity-70"
            hitSlop={10}
          >
            <ArrowLeftCuteReIcon width={20} height={20} color={useColor("label")} />
          </Pressable>
        }
        rightContent={
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={handleOpenPromptSettings}
              className="p-2 active:opacity-70"
              hitSlop={10}
            >
              <Settings1CuteReIcon width={20} height={20} color={useColor("label")} />
            </Pressable>
            <Pressable
              onPress={handleDeleteSite}
              className="p-2 active:opacity-70"
              hitSlop={10}
            >
              <Delete2CuteReIcon width={20} height={20} color={redColor} />
            </Pressable>
          </View>
        }
      />

      <ScrollView className="flex-1 px-4 pt-3" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Site Header Banner */}
        <View className="mb-4 rounded-2xl border border-opaque-separator/50 bg-secondary-system-background p-4">
          <View className="flex-row items-center gap-3">
            {site.favicon ? (
              <Image
                source={{ uri: site.favicon }}
                className="size-12 rounded-xl bg-quaternary-system-fill"
                resizeMode="cover"
              />
            ) : (
              <View className="size-12 items-center justify-center rounded-xl bg-quaternary-system-fill">
                <World2CuteReIcon width={26} height={26} color={primaryColor} />
              </View>
            )}

            <View className="flex-1">
              <Text className="text-[17px] font-bold text-label" numberOfLines={1}>
                {site.name}
              </Text>
              <Text className="text-[13px] text-secondary-label" numberOfLines={1}>
                {site.url}
              </Text>
            </View>
          </View>

          {site.description ? (
            <Text className="mt-2.5 text-[13px] leading-5 text-secondary-label">
              {site.description}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-center justify-between border-t border-opaque-separator/40 pt-2.5">
            <View className="flex-row items-center gap-1.5">
              <Rss2CuteFiIcon width={14} height={14} color={secondaryLabelColor} />
              <Text className="text-[12px] font-medium text-secondary-label">
                {siteCategories.length} danh mục khả dụng
              </Text>
            </View>
            <View className="rounded-md bg-accent/15 px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-accent uppercase">
                {site.type === "wordpress" ? "WordPress API" : "RSS"}
              </Text>
            </View>
          </View>
        </View>

        {/* Section title */}
        <Text className="mb-2 px-1 text-[13px] font-semibold text-secondary-label uppercase">
          Danh mục bài viết
        </Text>

        {loading ? (
          <View className="my-10 items-center justify-center">
            <ActivityIndicator color={primaryColor} size="large" />
            <Text className="mt-3 text-[14px] text-secondary-label">
              Đang tải danh mục từ trang web...
            </Text>
          </View>
        ) : siteCategories.length === 0 ? (
          <View className="my-10 items-center justify-center rounded-xl border border-dashed border-opaque-separator p-6">
            <Text className="text-center text-[14px] text-secondary-label">
              Không tìm thấy danh mục nào hoặc trang web chưa có bài viết.
            </Text>
          </View>
        ) : (
          <View className="overflow-hidden rounded-2xl border border-opaque-separator/50 bg-secondary-system-background">
            {siteCategories.map((cat, idx) => (
              <Pressable
                key={cat.id}
                onPress={() => handleOpenCategory(cat)}
                className={`flex-row items-center justify-between p-4 active:bg-quaternary-system-fill ${
                  idx > 0 ? "border-t border-opaque-separator/40" : ""
                }`}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[16px] font-medium text-label" numberOfLines={1}>
                    {cat.name}
                  </Text>
                  {cat.description ? (
                    <Text className="mt-0.5 text-[12px] text-secondary-label" numberOfLines={1}>
                      {cat.description}
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row items-center gap-2">
                  <View className="rounded-full bg-quaternary-system-fill px-2.5 py-0.5">
                    <Text className="text-[12px] font-semibold text-secondary-label">
                      {cat.count} bài
                    </Text>
                  </View>
                  <MingcuteRightLineIcon width={16} height={16} color={secondaryLabelColor} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

SiteCategoriesScreen.displayName = "SiteCategoriesScreen"
