import { useEffect, useState } from "react";
import api from "@/lib/api";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import PortfolioGrid from "@/components/PortfolioGrid";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/profile"),
      api.get("/categories"),
      api.get("/projects"),
    ])
      .then(([p, c, pr]) => {
        setProfile(p.data);
        setCategories(c.data);
        setProjects(pr.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="font-display text-sm tracking-[0.2em] uppercase text-neutral-500 caret">
          loading the studio
        </div>
      </div>
    );

  return (
    <div className="bg-white text-[#0A0B10] min-h-screen" data-testid="home-page">
      <Header profile={profile} />
      <Hero profile={profile} />
      <AboutSection profile={profile} />
      <PortfolioGrid categories={categories} projects={projects} />
      <ContactSection profile={profile} />
      <Footer profile={profile} />
    </div>
  );
}
