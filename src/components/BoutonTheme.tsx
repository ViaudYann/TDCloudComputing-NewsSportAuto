"use client";

import { useTheme } from "next-themes";
import SwitchButton from "@/components/kokonutui/switch-button";

export default function BoutonTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const theme =
    resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : undefined;

  return (
    <SwitchButton
      size="sm"
      showLabel={false}
      aria-label="Basculer entre thème clair et sombre"
      theme={theme}
      onThemeChange={setTheme}
    />
  );
}