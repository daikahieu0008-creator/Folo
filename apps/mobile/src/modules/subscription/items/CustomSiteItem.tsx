import type { FC } from "react"
import { Image, Pressable, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { MingcuteRightLineIcon } from "@/src/icons/mingcute_right_line"
import { World2CuteReIcon } from "@/src/icons/world_2_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { SiteCategoriesScreen } from "@/src/modules/custom-sites/SiteCategoriesScreen"
import type { SiteMetadata } from "@/src/services/site-scraper/types"
import { useColor } from "@/src/theme/colors"

export const CustomSiteItem: FC<{
  site: SiteMetadata
  isFirst?: boolean
  isLast?: boolean
}> = ({ site, isFirst = false, isLast = false }) => {
  const navigation = useNavigation()
  const primaryColor = useColor("accent")
  const secondaryLabelColor = useColor("secondaryLabel")

  const handlePress = () => {
    navigation.pushControllerView(SiteCategoriesScreen, { site })
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center justify-between px-4 py-3 bg-secondary-system-background active:opacity-70 ${
        isFirst ? "rounded-t-2xl" : ""
      } ${isLast ? "rounded-b-2xl" : "border-b border-opaque-separator/30"}`}
    >
      <View className="flex-row items-center gap-3 flex-1 pr-3">
        {site.favicon ? (
          <Image
            source={{ uri: site.favicon }}
            className="size-9 rounded-xl bg-quaternary-system-fill"
            resizeMode="cover"
          />
        ) : (
          <View className="size-9 items-center justify-center rounded-xl bg-quaternary-system-fill">
            <World2CuteReIcon width={20} height={20} color={primaryColor} />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[15px] font-semibold text-label" numberOfLines={1}>
              {site.name}
            </Text>
            <View className="rounded bg-accent/15 px-1 py-0.2">
              <Text className="text-[9px] font-medium text-accent uppercase">
                {site.type === "wordpress" ? "WP" : "RSS"}
              </Text>
            </View>
          </View>

          <Text className="text-[12px] text-secondary-label" numberOfLines={1}>
            {site.categoryCount ? `${site.categoryCount} danh mục` : site.url}
            {site.postCount ? ` • ${site.postCount} bài` : ""}
          </Text>
        </View>
      </View>

      <MingcuteRightLineIcon width={16} height={16} color={secondaryLabelColor} />
    </Pressable>
  )
}
