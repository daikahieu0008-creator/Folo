import type { FC, ReactNode } from "react"
import React, { useMemo } from "react"
import { View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

interface FormattedMarkdownSummaryProps {
  content: string
}

// Parse inline text with **bold** and (X.Y) notation
function parseInlineSpans(text: string, baseKey: string): ReactNode[] {
  // Regex to match **bold** or reference number like (1.2) or (5.10)
  const regex = /(\*\*.*?\*\*|\(\d+\.\d+\))/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    const key = `${baseKey}-${index}`

    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2)
      return (
        <Text key={key} className="font-bold text-label">
          {boldText}
        </Text>
      )
    }

    if (/^\(\d+\.\d+\)$/.test(part)) {
      return (
        <Text
          key={key}
          className="font-bold text-purple-600 dark:text-purple-400"
        >
          {" "}{part}
        </Text>
      )
    }

    return (
      <Text key={key} className="text-label">
        {part}
      </Text>
    )
  })
}

export const FormattedMarkdownSummary: FC<FormattedMarkdownSummaryProps> = ({ content }) => {
  const renderedElements = useMemo(() => {
    if (!content) return null

    const lines = content.split("\n")
    const elements: ReactNode[] = []

    lines.forEach((rawLine, lineIndex) => {
      const line = rawLine.trim()
      const key = `line-${lineIndex}`

      // Empty line -> small vertical spacing
      if (!line) {
        elements.push(<View key={key} className="h-2" />)
        return
      }

      // Horizontal separator: --- or ***
      if (line === "---" || line === "***" || line === "___") {
        elements.push(
          <View key={key} className="my-3 h-[1px] bg-opaque-separator/50" />,
        )
        return
      }

      // Heading 2 or Heading 3: ## Phần X... or ### ...
      if (line.startsWith("### ")) {
        const title = line.replace(/^###\s+/, "")
        elements.push(
          <View key={key} className="mt-3 mb-1.5 flex-row items-center gap-1.5">
            <View className="h-4 w-1 rounded-full bg-accent" />
            <Text className="text-[16px] font-bold text-label">
              {parseInlineSpans(title, `${key}-h3`)}
            </Text>
          </View>,
        )
        return
      }

      if (line.startsWith("## ")) {
        const title = line.replace(/^##\s+/, "")
        elements.push(
          <View key={key} className="mt-4 mb-2 rounded-xl bg-purple-500/10 px-3 py-2 border border-purple-500/25">
            <Text className="text-[16px] font-bold text-purple-700 dark:text-purple-300">
              {parseInlineSpans(title, `${key}-h2`)}
            </Text>
          </View>,
        )
        return
      }

      if (line.startsWith("# ")) {
        const title = line.replace(/^#\s+/, "")
        elements.push(
          <View key={key} className="mb-2">
            <Text className="text-[18px] font-extrabold text-label">
              {parseInlineSpans(title, `${key}-h1`)}
            </Text>
          </View>,
        )
        return
      }

      // Bullet points: - ... or * ...
      if (/^[-*]\s+/.test(line)) {
        const itemText = line.replace(/^[-*]\s+/, "")
        elements.push(
          <View key={key} className="my-1 flex-row items-start pl-1">
            <Text className="mr-2 text-[14px] text-purple-500">•</Text>
            <Text className="flex-1 text-[15px] leading-6 text-label">
              {parseInlineSpans(itemText, `${key}-li`)}
            </Text>
          </View>,
        )
        return
      }

      // Numbered items: 1. ... or 2. ...
      const numMatch = line.match(/^(\d+)\.\s+(.*)/)
      if (numMatch) {
        const num = numMatch[1]
        const itemText = numMatch[2]
        elements.push(
          <View key={key} className="my-1 flex-row items-start pl-1">
            <Text className="mr-1.5 font-bold text-[14px] text-accent">
              {num}.
            </Text>
            <Text className="flex-1 text-[15px] leading-6 text-label">
              {parseInlineSpans(itemText, `${key}-num`)}
            </Text>
          </View>,
        )
        return
      }

      // Regular paragraph
      elements.push(
        <Text key={key} className="my-0.5 text-[15px] leading-6 text-label">
          {parseInlineSpans(line, `${key}-p`)}
        </Text>,
      )
    })

    return elements
  }, [content])

  return <View className="w-full">{renderedElements}</View>
}
