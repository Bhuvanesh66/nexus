import { Difference } from "@/components/landing/Difference";
import { Eras } from "@/components/landing/Eras";
import { Hero } from "@/components/landing/Hero";
import { RevealObserver } from "@/components/landing/RevealObserver";
import { Tagline } from "@/components/landing/Tagline";
import { WhyNow } from "@/components/landing/WhyNow";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { usePageMeta } from "@/lib/session";

export default function HomePage() {
  usePageMeta(null);
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <WhyNow />
        <Tagline />
        <Difference />
        <Eras />
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}
