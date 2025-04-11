"use client"

import { Footer } from '../components/Sections/Footer';
import { Partners } from '../components/Sections/Partners';
import { Features } from '../components/Sections/Features';
import { Navigator } from '../components/Navigator/Navigator';
import { Presentation } from '../components/Sections/Presentation';
import { Testimonials } from '../components/Sections/Testimonials';
import { Documentation } from '../components/Sections/Documentation';
import { UnderConstruction } from '../components/Utils/UnderConstruction';

export default function Landing() {
  return (
    <main>
      <Navigator />
      <Presentation />
      <Partners />
      <Features />
      <Documentation />
      <Testimonials />
      <Footer />
      <UnderConstruction />
    </main>
  )
}