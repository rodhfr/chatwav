import Navbar from "./Navbar";

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <Navbar />
      <main className="flex min-h-0 flex-1">{children}</main>
    </div>
  );
}
