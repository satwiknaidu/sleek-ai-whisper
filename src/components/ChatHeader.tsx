
import { ThemeToggle } from "@/components/ThemeToggle";

export function ChatHeader() {
  return (
    <div className="flex items-center justify-between border-b py-3 px-4">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
        <h1 className="text-lg font-semibold">AI Assistant</h1>
      </div>
      <ThemeToggle />
    </div>
  );
}
