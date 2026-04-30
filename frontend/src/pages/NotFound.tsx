import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 — visitor wandered into a room that doesn't exist:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-xl reveal-up">
          <p className="gallery-eyebrow mb-6">— Wrong door</p>
          <h1
            className="font-display text-[140px] sm:text-[220px] text-transparent leading-none mb-6 tracking-tight"
            style={{
              WebkitTextStroke: "1.5px hsl(var(--primary) / 0.6)",
            }}
          >
            404
          </h1>
          <p className="font-display text-3xl sm:text-4xl text-ivory mb-4 leading-tight">
            The room you're looking for
            <br />
            <span className="italic text-champagne">isn't on display.</span>
          </p>
          <p className="text-muted-foreground mb-10 font-light max-w-md mx-auto">
            Perhaps it was rotated out, or the link aged. Step back into the main
            gallery and find your way.
          </p>
          <Link to="/" className="btn-gallery">
            Return to the gallery
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
