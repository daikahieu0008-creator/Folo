import type { FC, ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/src/components/ui/typography/Text"
import { useColor } from "@/src/theme/colors"

export interface NavigationHeaderViewProps {
  title?: string
  leftContent?: ReactNode
  rightContent?: ReactNode
}

export const NavigationHeaderView: FC<NavigationHeaderViewProps> = ({
  title,
  leftContent,
  rightContent,
}) => {
  const insets = useSafeAreaInsets()
  const borderColor = useColor("opaqueSeparator")
  const bgColor = useColor("systemBackground")

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: bgColor,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: borderColor,
      }}
    >
      <View className="h-12 flex-row items-center justify-between px-3">
        <View className="min-w-10 flex-row items-center justify-start">
          {leftContent}
        </View>

        <View className="flex-1 items-center justify-center px-2">
          {!!title && (
            <Text
              numberOfLines={1}
              className="text-center text-base font-semibold text-label"
            >
              {title}
            </Text>
          )}
        </View>

        <View className="min-w-10 flex-row items-center justify-end">
          {rightContent}
        </View>
      </View>
    </View>
  )
}
