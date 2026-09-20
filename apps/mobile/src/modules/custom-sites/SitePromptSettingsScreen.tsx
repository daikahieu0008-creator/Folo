import { useAtom } from "jotai"
import type { FC } from "react"
import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native"

import { siteCustomPromptsAtom } from "@/src/atoms/custom-sites"
import { NavigationHeaderView } from "@/src/components/layouts/views/NavigationHeaderView"
import { Text } from "@/src/components/ui/typography/Text"
import { ArrowLeftCuteReIcon } from "@/src/icons/arrow_left_cute_re"
import { CheckFilledIcon } from "@/src/icons/check_filled"
import { Refresh2CuteReIcon } from "@/src/icons/refresh_2_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { DEFAULT_DENTAL_PROMPT } from "@/src/services/ai/gemini-service"
import type { SiteMetadata } from "@/src/services/site-scraper/types"
import { useColor } from "@/src/theme/colors"

export const SitePromptSettingsScreen: FC<{
  site: SiteMetadata
}> = ({ site }) => {
  const navigation = useNavigation()
  const labelColor = useColor("label")
  const secondaryLabelColor = useColor("secondaryLabel")
  const primaryColor = useColor("accent")

  const [promptsMap, setPromptsMap] = useAtom(siteCustomPromptsAtom)
  const currentPrompt = promptsMap[site.id] || site.customPrompt || DEFAULT_DENTAL_PROMPT

  const [promptValue, setPromptValue] = useState(currentPrompt)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = () => {
    setPromptsMap((prev) => ({
      ...prev,
      [site.id]: promptValue.trim(),
    }))
    setSavedSuccess(true)
    setTimeout(() => {
      navigation.back()
    }, 800)
  }

  const handleResetDefault = () => {
    Alert.alert(
      "Khôi phục prompt mặc định",
      "Bạn có muốn đặt lại prompt tóm tắt chuyên môn Răng Hàm Mặt mặc định cho trang web này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khôi phục",
          onPress: () => {
            setPromptValue(DEFAULT_DENTAL_PROMPT)
          },
        },
      ],
    )
  }

  return (
    <View className="flex-1 bg-system-background">
      <NavigationHeaderView
        title="Cài đặt Prompt AI"
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
          <Pressable
            onPress={handleResetDefault}
            className="flex-row items-center gap-1 p-2 active:opacity-70"
            hitSlop={10}
          >
            <Refresh2CuteReIcon width={16} height={16} color={secondaryLabelColor} />
            <Text className="text-[12px] text-secondary-label">Mặc định</Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-3" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Information Card */}
          <View className="mb-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3.5">
            <Text className="text-[14px] font-bold text-purple-700 dark:text-purple-300">
              💡 Prompt tóm tắt cho: {site.name}
            </Text>
            <Text className="mt-1 text-[12px] leading-5 text-secondary-label">
              Prompt này sẽ tự động áp dụng cho tất cả bài viết thuộc toàn bộ các danh mục của trang web này. Bạn có thể chỉnh sửa nội dung bên dưới theo nhu cầu.
            </Text>
          </View>

          {/* Prompt Editor Box */}
          <View className="rounded-2xl border border-opaque-separator/60 bg-secondary-system-background p-3">
            <TextInput
              value={promptValue}
              onChangeText={setPromptValue}
              multiline={true}
              textAlignVertical="top"
              placeholder="Nhập prompt tùy chỉnh cho website..."
              placeholderTextColor={secondaryLabelColor}
              className="min-h-[380px] text-[14px] leading-6 text-label"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
              savedSuccess ? "bg-green-600" : "bg-accent active:opacity-80"
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckFilledIcon width={18} height={18} color="#FFFFFF" />
                <Text className="text-[15px] font-bold text-white">
                  Đã lưu cấu hình thành công!
                </Text>
              </>
            ) : (
              <Text className="text-[15px] font-bold text-white">
                Lưu Prompt cho website này
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
