import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TaskListView from "../components/TaskListView";
import FAB from "../components/FAB";
import { useAppTheme } from "../hooks/useAppTheme";
import { TasksStackParamList } from "../navigation/types";
import { addDays, formatDateLabel, todayString } from "../utils/date";

type Props = NativeStackScreenProps<TasksStackParamList, "TasksList">;

export default function TasksScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [date, setDate] = useState(todayString());

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={["top"]}>
      <View style={styles.brandRow}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
        <Text style={[styles.brand, { color: theme.text }]}>Grind Console</Text>
      </View>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={() => setDate((d) => addDays(d, -1))}>
          <Text style={[styles.navArrow, { color: theme.accent }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{formatDateLabel(date)}</Text>
        <Pressable style={styles.navButton} onPress={() => setDate((d) => addDays(d, 1))}>
          <Text style={[styles.navArrow, { color: theme.accent }]}>›</Text>
        </Pressable>
      </View>
      <TaskListView date={date} key={date} onEditTask={(task) => navigation.navigate("TaskForm", { date, taskId: task.id })} />
      <FAB theme={theme} onPress={() => navigation.navigate("TaskForm", { date })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  brand: { fontSize: 22, fontWeight: "800" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  title: { fontSize: 18, fontWeight: "600" },
  navButton: { paddingHorizontal: 16, paddingVertical: 8 },
  navArrow: { fontSize: 28, fontWeight: "600" },
});
