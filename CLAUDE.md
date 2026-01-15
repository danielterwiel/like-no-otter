# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iOS health & workout tracker combining HealthKit metrics, active workout logging, and task management. Built with Expo SDK 54, TypeScript, NativeWind v4, and react-native-reusables.

## Commands

```bash
# Development
yarn start              # Start Expo dev server
yarn ios                # Run on iOS simulator
yarn android            # Run on Android emulator

# Type checking
npx tsc --noEmit        # Check types without emitting
```

## Architecture

### Stack
- **Expo SDK 54** with New Architecture enabled
- **NativeWind v4** for Tailwind CSS styling in React Native
- **react-native-reusables** for UI components (shadcn/ui-style)
- **TypeScript** with strict mode

### Path Aliases
Use `@/` for imports (configured in tsconfig.json):
```typescript
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
```

### Styling Pattern
- Use `className` prop with Tailwind classes via NativeWind
- Use `cn()` utility from `@/lib/utils` to merge class names
- Theme colors defined as CSS variables in `global.css` (light/dark)
- Semantic color tokens: `bg-background`, `text-foreground`, `text-primary`, etc.

### Planned Architecture (from prd.json)
- **Database**: Drizzle ORM with expo-sqlite (`lib/db/`)
- **State**: XState for workout state machine
- **Data fetching**: TanStack Query with offline-first mode
- **Navigation**: Expo Router with 4-tab layout (Today, Health, Workouts, Tasks)
- **Testing**: Vitest for unit tests, Maestro for E2E

## UI Components

Add components via react-native-reusables CLI:
```bash
npx @react-native-reusables/cli@latest add <component>
```

Components go in `components/ui/`. Configuration in `components.json`.
