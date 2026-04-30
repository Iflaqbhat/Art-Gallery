import { createClient } from "@supabase/supabase-js";

// Defensive trim: if Netlify (or anyone editing env vars) accidentally adds
// surrounding whitespace, quotes, or a trailing newline, Supabase will
// respond with "Invalid API key" / 401 even though the rest of the value
// is correct. Strip those before handing the value to the SDK.
const cleanEnv = (v) => {
  if (typeof v !== "string") return "";
  return v.trim().replace(/^["']|["']$/g, "");
};

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

// One-line console hint so we can tell from the browser whether the build
// actually received valid-looking env values. We never log the full key.
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info(
    `[supabase] url=${supabaseUrl || "(missing)"} keyLen=${
      supabaseAnonKey.length
    } keyPrefix=${supabaseAnonKey.slice(0, 14) || "(missing)"}`
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify and re-deploy with cache cleared."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    /** Must stay true so ?code= is exchanged once in GoTrueClient._initialize(); AuthCallback must not call exchangeCodeForSession. */
    detectSessionInUrl: true,
  },
});

// Auth helper functions
export const auth = {
  signUp: async (email, password, options = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options,
    });
  },

  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getCurrentUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  getSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },
};

/** Upsert the active homepage hero banner.
 *
 *  Schema uses uuid PKs, so we don't address the row by a hard-coded id.
 *  We look up an existing active row, try to update it, and fall back to
 *  insert if either there is no row OR the update touches 0 rows (typically
 *  RLS hiding it). Tolerates older schemas missing columns like cta_link.
 */
async function updateFeaturedContent(bannerData) {
  let payload = { ...bannerData, is_active: true };

  const stripUnknownColumn = (error) => {
    if (error?.code === "PGRST204" && typeof error.message === "string") {
      const m = error.message.match(/'([^']+)' column/);
      if (m && m[1] in payload) {
        delete payload[m[1]];
        return true;
      }
    }
    return false;
  };

  const adminPermsError = () =>
    new Error(
      "Banner could not be saved. Your account is signed in but does not have admin permissions on this project. " +
        "Make sure your row in public.users has role='admin' (the schema does this for the first user automatically), " +
        "then sign out and back in."
    );

  // 1. Find existing active hero row (if any). maybeSingle returns null on 0 rows.
  let existingId = null;
  {
    const { data, error } = await supabase
      .from("featured_content")
      .select("id")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    existingId = data?.id ?? null;
  }

  // 2. Try to update; if it touches 0 rows, fall through to insert.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (existingId) {
      const { data, error } = await supabase
        .from("featured_content")
        .update(payload)
        .eq("id", existingId)
        .select();
      if (error) {
        if (stripUnknownColumn(error)) continue;
        throw error;
      }
      if (data && data.length > 0) return data[0];
      // Update returned no rows → row not visible to this user (likely RLS).
      // Fall through to insert as a fresh active row.
      existingId = null;
    }

    const { data, error } = await supabase
      .from("featured_content")
      .insert([payload])
      .select();
    if (error) {
      if (stripUnknownColumn(error)) continue;
      // RLS will throw 42501 (permission denied) or 401 here.
      if (error.code === "42501" || error.status === 401) {
        throw adminPermsError();
      }
      throw error;
    }
    if (data && data.length > 0) return data[0];
    throw adminPermsError();
  }

  throw new Error(
    "Failed to update featured content due to repeated schema mismatches."
  );
}

// Database helper functions
export const db = {
  // Artists
  getArtists: async () => {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching artists:", error);
      throw error;
    }
    console.log("✅ Artists fetched successfully:", data?.length || 0);
    return data;
  },

  getArtist: async (id) => {
    const { data, error } = await supabase
      .from("artists")
      .select(
        `
        *,
        artworks (
          id,
          title,
          image_url,
          year_created
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Collections
  getCollections: async () => {
    console.log("🔍 Starting collections fetch...");

    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching collections:", error);
        throw error;
      }

      console.log("✅ Collections raw data:", data);
      console.log("📊 Collections count:", data?.length || 0);

      return data;
    } catch (error) {
      console.error("💥 Collections fetch failed:", error);
      throw error;
    }
  },

  getCollection: async (id) => {
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        artworks (
          id,
          title,
          description,
          image_url,
          year_created,
          medium,
          price,
          artists (
            id,
            name
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Artworks
  getArtworks: async (filters = {}) => {
    let query = supabase.from("artworks").select(`
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

  getArtwork: async (id) => {
    const { data, error } = await supabase
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

  getArtistById: async (id) => {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  // Exhibitions
  getExhibitions: async () => {
    const { data, error } = await supabase
      .from("exhibitions")
      .select(
        `
        *,
        exhibition_artworks (
          artworks (
            id,
            title,
            image_url
          )
        )
      `
      )
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  getExhibition: async (id) => {
    const { data, error } = await supabase
      .from("exhibitions")
      .select(
        `
        *,
        exhibition_artworks (
          artworks (
            id,
            title,
            description,
            image_url,
            year_created,
            artists (
              id,
              name
            )
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Blog Posts
  getBlogPosts: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        `
        *,
        users (
          id,
          name
        )
      `
      )
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  getBlogPost: async (id) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        `
        *,
        users (
          id,
          name
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // User Favorites
  getUserFavorites: async (userId) => {
    const { data, error } = await supabase
      .from("user_favorites")
      .select(
        `
        artworks (
          id,
          title,
          image_url,
          artists (
            name
          )
        )
      `
      )
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  },

  addFavorite: async (userId, artworkId) => {
    const { data, error } = await supabase
      .from("user_favorites")
      .insert([{ user_id: userId, artwork_id: artworkId }]);

    if (error) throw error;
    return data;
  },

  removeFavorite: async (userId, artworkId) => {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("artwork_id", artworkId);

    if (error) throw error;
    return true;
  },

  // Admin functions for creating/updating content
  createArtwork: async (artworkData) => {
    const { data, error } = await supabase
      .from("artworks")
      .insert([artworkData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateArtwork: async (id, updates) => {
    const { data, error } = await supabase
      .from("artworks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteArtwork: async (id) => {
    const { error } = await supabase.from("artworks").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  createArtist: async (artistData) => {
    const { data, error } = await supabase
      .from("artists")
      .insert([artistData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateArtist: async (id, updates) => {
    const { data, error } = await supabase
      .from("artists")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteArtist: async (id) => {
    const { error } = await supabase.from("artists").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  createCollection: async (collectionData) => {
    const { data, error } = await supabase
      .from("collections")
      .insert([collectionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateCollection: async (id, updates) => {
    const { data, error } = await supabase
      .from("collections")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteCollection: async (id) => {
    const { error } = await supabase.from("collections").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  // Helper to get user by ID (with role)
  getUserById: async (id) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Helper to get artworks by artist
  getArtworksByArtist: async (artistId) => {
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("artist_id", artistId);

    if (error) throw error;
    return data;
  },

  // Get featured content for hero section
  getFeaturedContent: async () => {
    const { data, error } = await supabase
      .from("featured_content")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Helper to get artworks by collection
  getArtworksByCollection: async (collectionId) => {
    const { data, error } = await supabase
      .from("artworks")
      .select(
        `
        *,
        artists (
          id,
          name,
          bio,
          image_url
        )
      `
      )
      .eq("collection_id", collectionId);

    if (error) throw error;
    return data;
  },

  updateFeaturedContent,

  /** Submit a new inquiry. Public-insert is allowed by RLS so any visitor can
   *  send one without signing in. The frontend additionally forwards a copy
   *  to the curator's inbox via Web3Forms — see `submitInquiry` below. */
  createInquiry: async (payload) => {
    const { data, error } = await supabase
      .from("inquiries")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Admin-only: list every inquiry, newest first. */
  listInquiries: async () => {
    const { data, error } = await supabase
      .from("inquiries")
      .select(
        `
        *,
        artwork:artworks (id, title, image_url),
        collection:collections (id, title, banner_image_url)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /** Admin-only: change inquiry status / notes. */
  updateInquiry: async (id, updates) => {
    const { data, error } = await supabase
      .from("inquiries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteInquiry: async (id) => {
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};

// Storage helper functions
export const storage = {
  uploadFile: async (bucket, file, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  },

  getFileUrl: (bucket, path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Get signed URL with automatic refresh
  getSignedUrl: async (bucket, path, expiresIn = 3600) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.warn(
          `Failed to get signed URL for ${path}, falling back to public URL:`,
          error
        );
        // Fallback to public URL if signed URL fails
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      }

      return data.signedUrl;
    } catch (error) {
      console.warn(
        `Error getting signed URL for ${path}, falling back to public URL:`,
        error
      );
      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
  },

  deleteFile: async (bucket, path) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  },

  // Artwork-specific storage functions
  uploadArtworkImage: async (file, artworkId) => {
    const fileExt = file.name.split(".").pop();
    const safe = String(artworkId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${safe}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const filePath = `artworks/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from("artwork-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        });

      if (error) {
        console.error("❌ Storage upload error:", error);
        throw error;
      }

      const publicUrl = supabase.storage
        .from("artwork-images")
        .getPublicUrl(filePath).data.publicUrl;

      return { path: filePath, url: publicUrl, bucket: "artwork-images" };
    } catch (error) {
      console.error("Upload artwork image failed:", error);
      throw error;
    }
  },

  uploadArtworkAudio: async (file, artworkId) => {
    const fileExt = file.name.split(".").pop();
    const safe = String(artworkId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${safe}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const filePath = `audio/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from("artwork-audio")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        });

      if (error) throw error;

      const publicUrl = supabase.storage
        .from("artwork-audio")
        .getPublicUrl(filePath).data.publicUrl;

      return { path: filePath, url: publicUrl, bucket: "artwork-audio" };
    } catch (error) {
      console.error("Upload artwork audio failed:", error);
      throw error;
    }
  },

  /** Audio for a collection (the curator's intro / soundtrack for a room). */
  uploadCollectionAudio: async (file, collectionId) => {
    const fileExt = file.name.split(".").pop();
    const safe = String(collectionId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `collection-${safe}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${fileExt}`;
    const filePath = `collection-audio/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from("artwork-audio")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        });
      if (error) throw error;
      const publicUrl = supabase.storage
        .from("artwork-audio")
        .getPublicUrl(filePath).data.publicUrl;
      return { path: filePath, url: publicUrl, bucket: "artwork-audio" };
    } catch (error) {
      console.error("Upload collection audio failed:", error);
      throw error;
    }
  },

  /** Banner images for the homepage hero / collection covers. */
  uploadBannerImage: async (file, prefix = "banner") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from("artwork-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        });
      if (error) throw error;
      const publicUrl = supabase.storage
        .from("artwork-images")
        .getPublicUrl(filePath).data.publicUrl;
      return { path: filePath, url: publicUrl, bucket: "artwork-images" };
    } catch (error) {
      console.error("Upload banner image failed:", error);
      throw error;
    }
  },

  deleteArtworkImage: async (path) => {
    const { error } = await supabase.storage
      .from("artwork-images")
      .remove([path]);

    if (error) throw error;
    return true;
  },

  deleteArtworkAudio: async (path) => {
    const { error } = await supabase.storage
      .from("artwork-audio")
      .remove([path]);

    if (error) throw error;
    return true;
  },
};

// Additional helper functions for artwork detail page
export const getArtworkById = async (id) => {
  const { data, error } = await supabase
    .from("artworks")
    .select(
      `
      *,
      artist:artists(id, name, bio, image_url),
      collection:collections(id, title, description)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const getArtistById = async (id) => {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const getCollectionById = async (id) => {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const getArtworksByCollection = async (collectionId) => {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getArtworksByArtist = async (artistId) => {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export { updateFeaturedContent };
