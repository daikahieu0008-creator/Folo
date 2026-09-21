import { useSetAtom } from "jotai"
import type { FC } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native"
import WebView from "react-native-webview"

import { customPostsAtom } from "@/src/atoms/custom-sites"
import { NavigationHeaderView } from "@/src/components/layouts/views/NavigationHeaderView"
import { Text } from "@/src/components/ui/typography/Text"
import { ArrowLeftCuteReIcon } from "@/src/icons/arrow_left_cute_re"
import { ExternalLinkCuteReIcon } from "@/src/icons/external_link_cute_re"
import { ShareForwardCuteReIcon } from "@/src/icons/share_forward_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { InlineGeminiSummaryCard } from "@/src/modules/ai/InlineGeminiSummaryCard"
import type { SiteMetadata, SitePost } from "@/src/services/site-scraper/types"
import { useColor, useTheme } from "@/src/theme/colors"

export const PostDetailScreen: FC<{
  site: SiteMetadata
  post: SitePost
}> = ({ site, post }) => {
  const navigation = useNavigation()
  const theme = useTheme()
  const isDark = theme === "dark"

  const labelColor = useColor("label")
  const secondaryLabelColor = useColor("secondaryLabel")
  const primaryColor = useColor("accent")

  const [webViewHeight, setWebViewHeight] = useState(400)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const webViewRef = useRef<WebView>(null)
  const setAllPostsMap = useSetAtom(customPostsAtom)
  const screenWidth = Dimensions.get("window").width

  const formattedDate = useMemo(() => {
    if (!post.date) return ""
    try {
      const d = new Date(post.date)
      return d.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return post.date
    }
  }, [post.date])

  const handleShare = async () => {
    try {
      await Share.share({
        title: post.title,
        message: `${post.title} - ${post.link || site.url}`,
        url: post.link,
      })
    } catch {
      // ignore
    }
  }

  const handleOpenBrowser = () => {
    if (post.link) {
      Linking.openURL(post.link).catch(() => {})
    }
  }

  // Cancel speech on screen exit
  useEffect(() => {
    return () => {
      webViewRef.current?.injectJavaScript(`
        try { window.speechSynthesis.cancel(); } catch(e) {}
        true;
      `)
    }
  }, [])

  const handleSpeak = (text: string) => {
    const escaped = JSON.stringify(text)
    webViewRef.current?.injectJavaScript(`
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(${escaped});
        u.lang = "vi-VN";
        u.rate = 1.0;
        u.onstart = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_START" })); };
        u.onend = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_END" })); };
        u.onerror = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_END" })); };
        window.speechSynthesis.speak(u);
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_END" }));
      }
      true;
    `)
    setIsSpeaking(true)
  }

  const handleStopSpeak = () => {
    webViewRef.current?.injectJavaScript(`
      try { window.speechSynthesis.cancel(); } catch(e) {}
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_END" }));
      true;
    `)
    setIsSpeaking(false)
  }

  const handleSummaryGenerated = (summaryText: string) => {
    const categoryKey = `${site.id}_${post.categoryId || ""}`
    setAllPostsMap((prev) => {
      const currentList = prev[categoryKey] || []
      const updated = currentList.map((p) =>
        String(p.id) === String(post.id) ? { ...p, geminiSummary: summaryText } : p,
      )
      return {
        ...prev,
        [categoryKey]: updated,
      }
    })
  }

  const htmlSource = useMemo(() => {
    const textColor = isDark ? "#E6E6E6" : "#1A1A1A"
    const bgColor = isDark ? "#000000" : "#FFFFFF"
    const linkColor = "#FF5C00"
    const blockquoteBorder = isDark ? "#333333" : "#E0E0E0"
    const blockquoteBg = isDark ? "#141414" : "#F8F8F8"

    const htmlBody = post.content || `<p>${post.excerpt || "Không có nội dung chi tiết."}</p>`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0 16px 40px 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 17px;
            line-height: 1.68;
            color: ${textColor};
            background-color: ${bgColor};
            word-wrap: break-word;
          }
          img, video, iframe {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 12px;
            margin: 16px 0;
            display: block;
          }
          h1, h2, h3, h4, h5, h6 {
            color: ${textColor};
            font-weight: 700;
            line-height: 1.35;
            margin-top: 24px;
            margin-bottom: 12px;
          }
          h1 { font-size: 24px; }
          h2 { font-size: 21px; }
          h3 { font-size: 19px; }
          p { margin: 14px 0; }
          a { color: ${linkColor}; text-decoration: none; }
          blockquote {
            margin: 16px 0;
            padding: 10px 16px;
            border-left: 4px solid ${blockquoteBorder};
            background: ${blockquoteBg};
            border-radius: 4px;
            font-style: italic;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          th, td {
            border: 1px solid ${blockquoteBorder};
            padding: 8px;
            text-align: left;
            font-size: 14px;
          }
          pre, code {
            font-family: monospace;
            background: ${blockquoteBg};
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        ${htmlBody}
        <script>
          function sendHeight() {
            var height = document.documentElement.scrollHeight || document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "HEIGHT", height: height }));
          }
          window.addEventListener("load", sendHeight);
          setTimeout(sendHeight, 300);
          setTimeout(sendHeight, 1000);

          window.addEventListener("message", function(e) {
            try {
              var data = JSON.parse(e.data);
              if (data.type === "SPEAK") {
                window.speechSynthesis.cancel();
                var u = new SpeechSynthesisUtterance(data.text);
                u.lang = "vi-VN";
                u.rate = 1.0;
                u.onstart = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_START" })); };
                u.onend = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_END" })); };
                u.onerror = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_END" })); };
                window.speechSynthesis.speak(u);
              } else if (data.type === "STOP_SPEAK") {
                window.speechSynthesis.cancel();
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TTS_END" }));
              }
            } catch(err) {}
          });
        </script>
      </body>
      </html>
    `
  }, [isDark, post.content, post.excerpt])

  return (
    <View className="flex-1 bg-system-background">
      <NavigationHeaderView
        title=""
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
              onPress={handleShare}
              className="p-2 active:opacity-70"
              hitSlop={10}
            >
              <ShareForwardCuteReIcon width={20} height={20} color={labelColor} />
            </Pressable>
            <Pressable
              onPress={handleOpenBrowser}
              className="p-2 active:opacity-70"
              hitSlop={10}
            >
              <ExternalLinkCuteReIcon width={20} height={20} color={labelColor} />
            </Pressable>
          </View>
        }
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Post Metadata Header */}
        <View className="px-4 pt-3 pb-2">
          {post.categoryName ? (
            <View className="mb-2 self-start rounded-md bg-accent/15 px-2 py-0.5">
              <Text className="text-[12px] font-semibold text-accent">
                {post.categoryName}
              </Text>
            </View>
          ) : null}

          <Text className="text-[24px] font-bold leading-8 text-label">
            {post.title}
          </Text>

          <View className="mt-3 flex-row items-center justify-between border-b border-opaque-separator/30 pb-3">
            <Text className="text-[13px] text-secondary-label">
              {site.name} • {formattedDate}
            </Text>
            {post.isDownloaded ? (
              <View className="rounded-full bg-green-500/15 px-2 py-0.5">
                <Text className="text-[11px] font-medium text-green-600 dark:text-green-400">
                  ✓ Offline
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Gemini 3.5 Flash Lite Auto Summary & Chat Q&A Card */}
        <View className="px-4">
          <InlineGeminiSummaryCard
            site={site}
            post={post}
            isSpeaking={isSpeaking}
            onSpeak={handleSpeak}
            onStopSpeak={handleStopSpeak}
            onSummaryGenerated={handleSummaryGenerated}
          />
        </View>

        {/* HTML Article Content via WebView */}
        <View style={{ width: screenWidth, minHeight: webViewHeight }}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: htmlSource }}
            style={{
              backgroundColor: "transparent",
              height: webViewHeight,
              width: screenWidth,
            }}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data)
                if (data.type === "HEIGHT" && data.height) {
                  setWebViewHeight(Math.max(data.height + 40, 300))
                } else if (data.type === "TTS_START") {
                  setIsSpeaking(true)
                } else if (data.type === "TTS_END") {
                  setIsSpeaking(false)
                }
              } catch {
                // ignore
              }
            }}
          />
        </View>
      </ScrollView>
    </View>
  )
}

PostDetailScreen.displayName = "PostDetailScreen"
