import { LocationSelector } from "@/components/LocationSelector";

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 pb-40 pt-10 font-sans dark:bg-black">
      <LocationSelector />
    </div>
  );
}
