import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Dedicated anonymous Supabase client for public content
 * This client is completely isolated from authentication state
 * and should be used for public data and signed URLs
 */
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Public storage helper functions that are isolated from auth state
 * Use this for signed URLs that should work regardless of authentication
 */
export const publicStorage = {
  getSignedUrl: async (bucket, path, expiresIn = 3600) => {
    try {
      const { data, error } = await supabasePublic.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.warn(
          `Failed to get signed URL for ${path}, falling back to public URL:`,
          error
        );
        // Fallback to public URL if signed URL fails
        return supabasePublic.storage.from(bucket).getPublicUrl(path).data
          .publicUrl;
      }

      return data.signedUrl;
    } catch (error) {
      console.warn(
        `Error getting signed URL for ${path}, falling back to public URL:`,
        error
      );
      return supabasePublic.storage.from(bucket).getPublicUrl(path).data
        .publicUrl;
    }
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabasePublic.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};

/**
 * Public database helper functions that are isolated from auth state
 */
export const publicDb = {
  // Collections
  getCollections: async () => {
    console.log("🔍 Starting public collections fetch...");

    try {
      const { data, error } = await supabasePublic
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching public collections:", error);
        throw error;
      }

      console.log("✅ Public collections raw data:", data);
      console.log("📊 Public collections count:", data?.length || 0);

      return data;
    } catch (error) {
      console.error("💥 Public collections fetch failed:", error);
      throw error;
    }
  },

  // Artworks
  getArtworks: async (filters = {}) => {
    let query = supabasePublic.from("artworks").select(`
        *,
        artists (
          id,
          name
        ),
        collections (
          id,
          title
        )
      `);

    if (filters.artist_id) {
      query = query.eq("artist_id", filters.artist_id);
    }
    if (filters.collection_id) {
      query = query.eq("collection_id", filters.collection_id);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  },

  // Single artwork
  getArtwork: async (id) => {
    const { data, error } = await supabasePublic
      .from("artworks")
      .select(
        `
        *,
        artists (
          id,
          name,
          bio,
          nationality
        ),
        collections (
          id,
          title
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Artists
  getArtists: async () => {
    const { data, error } = await supabasePublic
      .from("artists")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching public artists:", error);
      throw error;
    }
    console.log("✅ Public artists fetched successfully:", data?.length || 0);
    return data;
  },

  getFeaturedContent: async () => {
    const { data, error } = await supabasePublic
      .from("featured_content")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1);

    if (error) {
      console.error("Error fetching featured content:", error);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  },

  getArtworksByCollection: async (collectionId) => {
    const { data, error } = await supabasePublic
      .from("artworks")
      .select("*")
      .eq("collection_id", collectionId);

    if (error) throw error;
    return data || [];
  },

  getArtworksByArtist: async (artistId) => {
    const { data, error } = await supabasePublic
      .from("artworks")
      .select("*")
      .eq("artist_id", artistId);

    if (error) throw error;
    return data || [];
  },
};
