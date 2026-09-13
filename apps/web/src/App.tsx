import type { FC } from 'react'
import { Navbar } from './components/Navbar'
import { HeroSection } from './components/HeroSection'
import { StatsBanner } from './components/StatsBanner'
import { FeatureGrid } from './components/FeatureGrid'
import { ArchitectureVisualizer } from './components/ArchitectureVisualizer'
import { DocsSection } from './components/DocsSection'
import { DownloadSection } from './components/DownloadSection'
import { Footer } from './components/Footer'

export const App: FC = () => {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBanner />
        <FeatureGrid />
        <ArchitectureVisualizer />
        <DocsSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  )
}

export default App
