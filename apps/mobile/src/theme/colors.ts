import { useColorScheme } from "react-native"

export const accentColor = "#FF5C00"

export * from "react-native-uikit-colors"

export const useTheme = () => {
  const scheme = useColorScheme()
  return scheme || "light"
}
