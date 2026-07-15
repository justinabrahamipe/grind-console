import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, Theme } from "../theme";

export function useAppTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
