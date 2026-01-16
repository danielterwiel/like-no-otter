import * as React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View testID="error-boundary" className="flex-1 bg-background p-4">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          >
            <Card className="mx-4">
              <CardHeader className="items-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <Ionicons name="alert-circle" size={32} color="#ef4444" />
                </View>
                <CardTitle className="text-center">Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="gap-4">
                <Text className="text-center text-muted-foreground">
                  The app encountered an unexpected error. You can try again or restart the app.
                </Text>

                {this.state.error && (
                  <View className="rounded-lg bg-muted p-3">
                    <Text className="font-mono text-xs text-muted-foreground">
                      {this.state.error.message}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  testID="error-boundary-retry"
                  className="mt-2 items-center rounded-lg bg-primary px-6 py-3"
                  onPress={this.handleRetry}
                  activeOpacity={0.7}
                >
                  <Text className="font-semibold text-primary-foreground">Try Again</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
