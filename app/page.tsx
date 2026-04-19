import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Experience } from "@/sections/Experience";
import { Projects } from "@/sections/Projects";
import { Coursework } from "@/sections/Coursework";
import { Skills } from "@/sections/Skills";
import { Achievements } from "@/sections/Achievements";
import { Talk } from "@/sections/Talk";
import { Writing } from "@/sections/Writing";
import { Contact } from "@/sections/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Coursework />
      <Skills />
      <Achievements />
      <Talk />
      <Writing />
      <Contact />
      <Footer />
    </>
  );
}
