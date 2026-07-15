import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Theme } from "../theme";

type Props = {
  theme: Theme;
  onPress: () => void;
};

export default function FAB({ theme, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={onPress}
      hitSlop={8}
    >
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
});
