import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

const AccessDenied = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md reveal-up">
        <Lock className="h-7 w-7 text-champagne mx-auto mb-6" />
        <p className="gallery-eyebrow mb-5">— Restricted</p>
        <h1 className="font-display text-5xl sm:text-6xl text-ivory mb-4 leading-tight">
          This door is for
          <br />
          <span className="italic text-champagne">curators only.</span>
        </h1>
        <p className="text-muted-foreground mb-10 font-light">
          You don't have access to this section of the gallery. If you believe
          this is in error, return to the main rooms or sign in with curator
          credentials.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-gallery">
            Back to the gallery
          </Link>
          <Link to="/auth/login" className="btn-gallery-ghost">
            Sign in
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default AccessDenied;
