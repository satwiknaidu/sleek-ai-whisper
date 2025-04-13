
import { Chat } from "@/components/Chat";

const Index = () => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <div className="flex flex-col flex-1 h-full max-w-4xl w-full mx-auto">
        <Chat />
      </div>
    </div>
  );
};

export default Index;
