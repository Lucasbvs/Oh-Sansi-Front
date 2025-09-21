import Navbar from "../components/navbar";
import Hero from "../components/hero";
import Footer from "../components/footer";

export default function Home({ children }: { children: React.ReactNode }) {
  return (
  <div className="flex flex-col min-h-screen">
    <Navbar/>

    <main className="flex-grow">
      <Hero />
    </main>

    <Footer />
  </div>
  );
}
