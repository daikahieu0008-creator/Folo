import { useAtomValue } from "jotai"
import type { FC } from "react"
import { useEffect, useRef, useState } from "react"
import * as Clipboard from "expo-clipboard"
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
} from "react-native"

import { siteCustomPromptsAtom } from "@/src/atoms/custom-sites"
import { Text } from "@/src/components/ui/typography/Text"
import { AiCuteReIcon } from "@/src/icons/ai_cute_re"
import { CopyCuteReIcon } from "@/src/icons/copy_cute_re"
import { Refresh2CuteReIcon } from "@/src/icons/refresh_2_cute_re"
import { SendPlaneCuteFiIcon } from "@/src/icons/send_plane_cute_fi"
import { VolumeCuteReIcon } from "@/src/icons/volume_cute_re"
import { VolumeOffCuteReIcon } from "@/src/icons/volume_off_cute_re"
import {
  type ChatMessage,
  chatAboutArticleWithGemini,
  summarizeArticleWithGemini,
} from "@/src/services/ai/gemini-service"
import type { SiteMetadata, SitePost } from "@/src/services/site-scraper/types"
import { useColor } from "@/src/theme/colors"

import { FormattedMarkdownSummary } from "./FormattedMarkdownSummary"

export const InlineGeminiSummaryCard: FC<{
  site: SiteMetadata
  post: SitePost
  onSpeak?: (text: string) => void
  onStopSpeak?: () => void
  isSpeaking?: boolean
  onSummaryGenerated?: (summary: string) => void
}> = ({
  site,
  post,
  onSpeak,
  onStopSpeak,
  isSpeaking = false,
  onSummaryGenerated,
}) => {
  const customPromptsMap = useAtomValue(siteCustomPromptsAtom)
  const sitePrompt = customPromptsMap[site.id] || site.customPrompt

  const [summary, setSummary] = useState<string>(post.geminiSummary || "")
  const [loading, setLoading] = useState<boolean>(!post.geminiSummary)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // Chat Q&A states
  const [showChat, setShowChat] = useState<boolean>(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputQuestion, setInputQuestion] = useState<string>("")
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false)

  const primaryColor = useColor("accent")
  const secondaryLabelColor = useColor("secondaryLabel")
  const purpleColor = "#9333EA"

  const hasFetchedRef = useRef(false)

  // Auto-trigger summarization immediately when article opens
  useEffect(() => {
    if (summary) return
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    let isMounted = true
    setLoading(true)
    setError(null)

    summarizeArticleWithGemini({
      title: post.title,
      content: post.content || post.excerpt,
      excerpt: post.excerpt,
      siteName: site.name,
      customPrompt: sitePrompt,
    })
      .then((res) => {
        if (isMounted) {
          setSummary(res)
          setLoading(false)
          onSummaryGenerated?.(res)
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || "Không thể tạo tóm tắt")
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [onSummaryGenerated, post.content, post.excerpt, post.title, site.name, sitePrompt, summary])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    summarizeArticleWithGemini({
      title: post.title,
      content: post.content || post.excerpt,
      excerpt: post.excerpt,
      siteName: site.name,
      customPrompt: sitePrompt,
    })
      .then((res) => {
        setSummary(res)
        setLoading(false)
        onSummaryGenerated?.(res)
      })
      .catch((err: any) => {
        setError(err.message || "Không thể tạo tóm tắt")
        setLoading(false)
      })
  }

  const handleCopy = () => {
    if (!summary) return
    Clipboard.setStringAsync(summary).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      onStopSpeak?.()
    } else {
      if (summary) {
        onSpeak?.(summary)
      }
    }
  }

  const handleSendQuestion = async () => {
    const q = inputQuestion.trim()
    if (!q || isSendingChat) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: q,
      createdAt: Date.now(),
    }

    const updatedHistory = [...chatHistory, userMsg]
    setChatHistory(updatedHistory)
    setInputQuestion("")
    setIsSendingChat(true)

    try {
      const replyText = await chatAboutArticleWithGemini({
        title: post.title,
        content: post.content || post.excerpt,
        summary,
        history: updatedHistory,
        question: q,
      })

      const modelMsg: ChatMessage = {
        id: `gemini-${Date.now()}`,
        role: "model",
        text: replyText,
        createdAt: Date.now(),
      }

      setChatHistory((prev) => [...prev, modelMsg])
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "model",
        text: `Lỗi: ${err.message || "Không thể trả lời"}`,
        createdAt: Date.now(),
      }
      setChatHistory((prev) => [...prev, errorMsg])
    } finally {
      setIsSendingChat(false)
    }
  }

  return (
    <View className="my-3 overflow-hidden rounded-2xl border border-purple-500/30 bg-secondary-system-background p-4 shadow-sm">
      {/* Card Header */}
      <View className="flex-row items-center justify-between border-b border-opaque-separator/30 pb-3">
        <View className="flex-row items-center gap-2">
          <View className="rounded-lg bg-purple-500/15 p-1.5">
            <AiCuteReIcon width={17} height={17} color={purpleColor} />
          </View>
          <Text className="text-[15px] font-bold text-label">
            Gemini 3.5 Flash Lite
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          {/* TTS Button */}
          {summary ? (
            <Pressable
              onPress={handleToggleSpeak}
              className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${
                isSpeaking
                  ? "bg-purple-600"
                  : "border border-purple-500/40 bg-purple-500/10 active:opacity-70"
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeOffCuteReIcon width={14} height={14} color="#FFFFFF" />
                  <Text className="text-[11px] font-semibold text-white">Dừng</Text>
                </>
              ) : (
                <>
                  <VolumeCuteReIcon width={14} height={14} color={purpleColor} />
                  <Text className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Đọc tóm tắt
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          {/* Copy Button */}
          {summary ? (
            <Pressable
              onPress={handleCopy}
              className="rounded-full bg-quaternary-system-fill p-1.5 active:opacity-60"
              hitSlop={8}
            >
              <CopyCuteReIcon width={15} height={15} color={secondaryLabelColor} />
            </Pressable>
          ) : null}

          {/* Refresh Button */}
          <Pressable
            onPress={handleRetry}
            disabled={loading}
            className="rounded-full bg-quaternary-system-fill p-1.5 active:opacity-60"
            hitSlop={8}
          >
            <Refresh2CuteReIcon width={15} height={15} color={secondaryLabelColor} />
          </Pressable>
        </View>
      </View>

      {/* Summary Content Body */}
      {loading ? (
        <View className="py-5 items-center justify-center gap-2">
          <ActivityIndicator size="small" color={purpleColor} />
          <Text className="text-[13px] text-secondary-label">
            ✨ Gemini 3.5 Flash Lite đang tự động tóm tắt bài viết...
          </Text>
        </View>
      ) : error ? (
        <View className="py-4 items-center justify-center gap-2">
          <Text className="text-center text-[13px] text-red-500">{error}</Text>
          <Pressable
            onPress={handleRetry}
            className="rounded-lg bg-accent px-3 py-1.5 active:opacity-80"
          >
            <Text className="text-[12px] font-semibold text-white">Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <View className="pt-3">
          <FormattedMarkdownSummary content={summary} />

          {copied ? (
            <Text className="mt-2 text-right text-[11px] text-green-600 dark:text-green-400 font-medium">
              ✓ Đã sao chép vào bộ nhớ tạm
            </Text>
          ) : null}
        </View>
      )}

      {/* Chat Q&A Section */}
      {summary ? (
        <View className="mt-4 border-t border-opaque-separator/30 pt-3">
          <Pressable
            onPress={() => setShowChat((prev) => !prev)}
            className="flex-row items-center justify-between py-1"
          >
            <Text className="text-[13px] font-semibold text-purple-600 dark:text-purple-400">
              💬 {showChat ? "Thu gọn phần hỏi đáp" : "Hỏi thêm về bài viết này..."}
            </Text>
            <Text className="text-[11px] text-secondary-label">
              {chatHistory.length > 0 ? `${chatHistory.length} câu trả lời` : ""}
            </Text>
          </Pressable>

          {showChat ? (
            <View className="mt-2.5">
              {/* Chat Message History */}
              {chatHistory.length > 0 ? (
                <View className="mb-3 gap-2.5">
                  {chatHistory.map((msg) => (
                    <View
                      key={msg.id}
                      className={`rounded-xl p-3 ${
                        msg.role === "user"
                          ? "self-end bg-accent/15 max-w-[85%]"
                          : "self-start bg-quaternary-system-fill max-w-[95%]"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold mb-1 ${
                          msg.role === "user" ? "text-accent" : "text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {msg.role === "user" ? "Bạn" : "Gemini 3.5 Flash Lite"}
                      </Text>
                      {msg.role === "user" ? (
                        <Text className="text-[14px] leading-5 text-label" selectable={true}>
                          {msg.text}
                        </Text>
                      ) : (
                        <FormattedMarkdownSummary content={msg.text} />
                      )}
                    </View>
                  ))}

                  {isSendingChat ? (
                    <View className="self-start rounded-xl bg-quaternary-system-fill p-3 flex-row items-center gap-2">
                      <ActivityIndicator size="small" color={purpleColor} />
                      <Text className="text-[12px] text-secondary-label">
                        Gemini đang trả lời...
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Chat Input Box */}
              <View className="flex-row items-center gap-2 rounded-xl border border-opaque-separator/50 bg-system-background px-3 py-1.5">
                <TextInput
                  value={inputQuestion}
                  onChangeText={setInputQuestion}
                  placeholder="Đặt câu hỏi về bài viết này..."
                  placeholderTextColor={secondaryLabelColor}
                  className="flex-1 text-[14px] text-label py-1"
                  multiline={false}
                  onSubmitEditing={handleSendQuestion}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={handleSendQuestion}
                  disabled={!inputQuestion.trim() || isSendingChat}
                  className={`rounded-lg p-2 ${
                    inputQuestion.trim() && !isSendingChat ? "bg-accent active:opacity-80" : "opacity-40"
                  }`}
                  hitSlop={6}
                >
                  <SendPlaneCuteFiIcon width={16} height={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
