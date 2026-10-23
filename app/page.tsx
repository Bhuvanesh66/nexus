import { Difference } from "@/components/landing/Difference";
import { Hero } from "@/components/landing/Hero";
import { RevealObserver } from "@/components/landing/RevealObserver";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Difference />
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}
