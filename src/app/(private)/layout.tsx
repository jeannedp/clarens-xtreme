import { Header } from "@/components/layout/header";

export default function PrivateLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />

      <div className="flex flex-1 min-h-0 flex-row items-start overflow-y-auto p-6 bg-[#f1f3f0] justify-center">
        {children}
      </div>
    </>
  );
}