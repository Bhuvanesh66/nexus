import { Difference } from "@/components/landing/Difference";
import { Eras } from "@/components/landing/Eras";
import { Hero } from "@/components/landing/Hero";
import { RevealObserver } from "@/components/landing/RevealObserver";
import { WhyNow } from "@/components/landing/WhyNow";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <WhyNow />
        <Difference />
        <Eras />
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}
