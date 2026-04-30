import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

interface Collection {
  id: string;
  title: string;
  description?: string;
  banner_image_url: string;
  created_at: string;
}

interface CollectionCardProps {
  collection: Collection;
  isAuthenticated: boolean;
  index?: number;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  isAuthenticated,
  index = 0,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate("/auth/register");
    }
  };

  const inner = (
    <article className="group cursor-pointer space-y-4">
      <div className="relative overflow-hidden bg-secondary aspect-[4/5] border border-border group-hover:border-champagne/50 transition-smooth">
        <img
          src={collection.banner_image_url || "/placeholder.svg"}
          alt={collection.title}
          className="w-full h-full object-cover transition-slow group-hover:scale-105"
          style={{ filter: "saturate(0.92)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-warmblack/70 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="gallery-plate">
            Room · {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        {!isAuthenticated && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-warmblack/60 transition-opacity">
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-champagne flex items-center gap-2">
              <Lock className="h-3 w-3" /> Become a member to view
            </span>
          </div>
        )}
      </div>
      <div className="px-1 space-y-1">
        <h3 className="font-display text-xl text-ivory leading-tight group-hover:text-champagne transition-colors line-clamp-1">
          {collection.title}
        </h3>
        {collection.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 font-light">
            {collection.description}
          </p>
        )}
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground pt-1">
          {new Date(collection.created_at).getFullYear()}
        </p>
      </div>
    </article>
  );

  return isAuthenticated ? (
    <Link to={`/collection/${collection.id}`} className="block">
      {inner}
    </Link>
  ) : (
    <div onClick={handleClick}>{inner}</div>
  );
};

export default CollectionCard;
