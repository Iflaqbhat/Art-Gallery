/**
 * Canvaso — Art Gallery
 * Curated seed data for the public schema.
 *
 *   USAGE
 *     1. Run the PostgreSQL migration.
 *     2. Set DATABASE_URL in server/.env.
 *     3. Run `npm run db:seed` from the repository root.
 *
 *   WHAT IT DOES
 *     • Refuses to run unless the gallery tables are empty.
 *     • Inserts 4 artists, 5 collections, 14 artworks.
 *     • Inserts a single homepage hero banner.
 *
 *   USERS / FAVORITES are NOT touched.
 */

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Curated dataset                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

// User-verified Unsplash URLs (paintings / gallery imagery that loads).
const ART = {
  watercolour_landscape:
    "https://images.unsplash.com/photo-1579783902915-f0b0de2c2eb3?q=80&w=1470&auto=format&fit=crop",
  still_life_grapes:
    "https://images.unsplash.com/photo-1578301978069-45264734cddc?q=80&w=824&auto=format&fit=crop",
  abstract_geometric:
    "https://images.unsplash.com/photo-1590622974113-66a9160acf20?q=80&w=1740&auto=format&fit=crop",
  marble_pour:
    "https://plus.unsplash.com/premium_photo-1664640458839-000c310875fa?q=80&w=774&auto=format&fit=crop",
  gallery_wall:
    "https://plus.unsplash.com/premium_photo-1677609991615-0657859f0a8a?w=1400&auto=format&fit=crop",
  horse_carriage:
    "https://images.unsplash.com/photo-1582561879313-ea72c2743e68?q=80&w=1056&auto=format&fit=crop",
  studio_easel:
    "https://plus.unsplash.com/premium_photo-1682125139523-92d7def89cd1?q=80&w=1160&auto=format&fit=crop",
  historical_court:
    "https://images.unsplash.com/photo-1621379282411-62964e75a502?q=80&w=1548&auto=format&fit=crop",
  girl_with_flowers:
    "https://images.unsplash.com/photo-1578320743746-788d990bd318?q=80&w=1442&auto=format&fit=crop",
  girl_with_bowl:
    "https://images.unsplash.com/photo-1578321271369-d008a1ee4fd2?q=80&w=862&auto=format&fit=crop",
  sun_collage:
    "https://images.unsplash.com/photo-1583243552320-73d7f2f21e7a?q=80&w=968&auto=format&fit=crop",
};

const ARTISTS = [
  {
    name: "Iflaq Bhat",
    bio: "Founder of Canvaso. A self-taught painter from Pulwama, Kashmir, working primarily in oils, exploring landscape, light, and the quiet between things.",
    birth_year: 2002,
    nationality: "Indian",
    style: "Contemporary realism",
    image_url: ART.watercolour_landscape,
    is_featured: true,
  },
  {
    name: "Margot Calder",
    bio: "British sculptor and printmaker. Her work moves between bronze studies and large-format intaglio prints, often returning to the human hand as subject.",
    birth_year: 1962,
    nationality: "British",
    style: "Figurative · Bronze",
    image_url: ART.gallery_wall,
    is_featured: true,
  },
  {
    name: "Jules Renault",
    bio: "Paris-based painter exploring the formal language of still life under varying conditions of weather and indoor light.",
    birth_year: 1978,
    nationality: "French",
    style: "Still life · Oil",
    image_url: ART.studio_easel,
    is_featured: false,
  },
  {
    name: "Saira Iyer",
    bio: "Mumbai-born textile artist and weaver working in indigo, kalamkari, and contemporary composition.",
    birth_year: 1985,
    nationality: "Indian",
    style: "Textile · Mixed media",
    image_url: ART.sun_collage,
    is_featured: true,
  },
];

const COLLECTIONS = [
  {
    title: "The North Light Room",
    description:
      "A quiet survey of north-facing windows, cool morning interiors, and the stillness that lives between objects. Twelve works selected from this season.",
    banner_image_url: ART.watercolour_landscape,
    is_featured: true,
    display_order: 1,
  },
  {
    title: "Studies in Bronze",
    description:
      "Hands, vessels, fragments. A continuing conversation with the ancient material — from Calder's notebook to the gallery floor.",
    banner_image_url: ART.gallery_wall,
    is_featured: true,
    display_order: 2,
  },
  {
    title: "Indigo & Cloth",
    description:
      "Saira Iyer's experiments at the loom — natural dye, hand-woven cotton, and contemporary composition rooted in centuries of craft.",
    banner_image_url: ART.marble_pour,
    is_featured: false,
    display_order: 3,
  },
  {
    title: "Letters from a Garden",
    description:
      "Renault's late-summer studies — geraniums, citrus, salt-faded linens. Painted slowly, in oil, between June and September.",
    banner_image_url: ART.still_life_grapes,
    is_featured: false,
    display_order: 4,
  },
  {
    title: "The Long Room",
    description:
      "An open salon hang — newer acquisitions and gallery favorites, refreshed monthly.",
    banner_image_url: ART.historical_court,
    is_featured: false,
    display_order: 5,
  },
];

/** Each entry references an artist + collection by name; we'll resolve IDs. */
const ARTWORKS = [
  // --- The North Light Room (Iflaq Bhat) ---
  {
    title: "Northern Window, no. 4",
    description:
      "Watercolour on cold-pressed paper. Painted from a single window in early March, before sunrise.",
    artist: "Iflaq Bhat",
    collection: "The North Light Room",
    year_created: 2024,
    medium: "Watercolour on paper",
    dimensions: "60 × 80 cm",
    price: 1800,
    image_url: ART.watercolour_landscape,
    is_featured: true,
  },
  {
    title: "A Quiet Bowl",
    description:
      "From a series of indoor objects studied under a single ceiling lamp.",
    artist: "Iflaq Bhat",
    collection: "The North Light Room",
    year_created: 2024,
    medium: "Oil on board",
    dimensions: "30 × 40 cm",
    price: 950,
    image_url: ART.girl_with_bowl,
  },
  {
    title: "March Morning",
    description: "Snowmelt out of focus. A landscape warmed by yellow light.",
    artist: "Iflaq Bhat",
    collection: "The North Light Room",
    year_created: 2024,
    medium: "Oil on linen",
    dimensions: "70 × 100 cm",
    price: 2400,
    image_url: ART.sun_collage,
  },

  // --- Studies in Bronze (Margot Calder) ---
  {
    title: "Hand, opened",
    description: "Bronze, cast from a wax study. Edition of 7.",
    artist: "Margot Calder",
    collection: "Studies in Bronze",
    year_created: 2023,
    medium: "Bronze · cast",
    dimensions: "22 × 14 × 10 cm",
    price: 4200,
    image_url: ART.gallery_wall,
    is_featured: true,
  },
  {
    title: "Vessel, no. 19",
    description:
      "From an ongoing series of small bronze vessels begun in 2018.",
    artist: "Margot Calder",
    collection: "Studies in Bronze",
    year_created: 2024,
    medium: "Bronze · cast",
    dimensions: "18 × 12 × 12 cm",
    price: 3100,
    image_url: ART.studio_easel,
  },
  {
    title: "Plate II — Hand at rest",
    description: "Drypoint and intaglio on hand-pressed paper. Edition of 12.",
    artist: "Margot Calder",
    collection: "Studies in Bronze",
    year_created: 2023,
    medium: "Drypoint · intaglio",
    dimensions: "40 × 50 cm",
    price: 850,
    image_url: ART.horse_carriage,
  },

  // --- Indigo & Cloth (Saira Iyer) ---
  {
    title: "Indigo Field, no. 2",
    description:
      "Hand-woven cotton, natural indigo. From a series of nine works.",
    artist: "Saira Iyer",
    collection: "Indigo & Cloth",
    year_created: 2024,
    medium: "Hand-woven cotton",
    dimensions: "120 × 90 cm",
    price: 1600,
    image_url: ART.marble_pour,
    is_featured: true,
  },
  {
    title: "Kalamkari Margin",
    description:
      "Hand-painted cotton with traditional vegetable-dye border.",
    artist: "Saira Iyer",
    collection: "Indigo & Cloth",
    year_created: 2023,
    medium: "Cotton · vegetable dye",
    dimensions: "100 × 70 cm",
    price: 1100,
    image_url: ART.abstract_geometric,
  },
  {
    title: "Untitled Weave (blue)",
    description:
      "A study in repetition. Hand-woven cotton over a silk warp.",
    artist: "Saira Iyer",
    collection: "Indigo & Cloth",
    year_created: 2024,
    medium: "Cotton · silk",
    dimensions: "80 × 60 cm",
    price: 750,
    image_url: ART.sun_collage,
  },

  // --- Letters from a Garden (Jules Renault) ---
  {
    title: "Geraniums on a Painted Table",
    description: "Late-summer studio still life. Oil on canvas.",
    artist: "Jules Renault",
    collection: "Letters from a Garden",
    year_created: 2024,
    medium: "Oil on canvas",
    dimensions: "50 × 60 cm",
    price: 1300,
    image_url: ART.still_life_grapes,
  },
  {
    title: "Lemons & Linen",
    description:
      "From a six-panel series painted between June and September.",
    artist: "Jules Renault",
    collection: "Letters from a Garden",
    year_created: 2024,
    medium: "Oil on canvas",
    dimensions: "45 × 55 cm",
    price: 1100,
    image_url: ART.girl_with_flowers,
  },
  {
    title: "Unfinished, no. 3",
    description: "Left intentionally open. Pigment on linen.",
    artist: "Jules Renault",
    collection: "Letters from a Garden",
    year_created: 2024,
    medium: "Oil on linen",
    dimensions: "70 × 50 cm",
    price: 1500,
    image_url: ART.studio_easel,
  },

  // --- The Long Room (mixed) ---
  {
    title: "Salon Hang, Wall A",
    description:
      "A composite sketch from the gallery's main wall, painted in situ.",
    artist: "Iflaq Bhat",
    collection: "The Long Room",
    year_created: 2024,
    medium: "Pencil & oil on board",
    dimensions: "40 × 30 cm",
    price: 600,
    image_url: ART.gallery_wall,
  },
  {
    title: "Drawer Study",
    description:
      "An old drawer, three keys, a folded letter. Oil on board.",
    artist: "Jules Renault",
    collection: "The Long Room",
    year_created: 2023,
    medium: "Oil on board",
    dimensions: "35 × 45 cm",
    price: 800,
    image_url: ART.historical_court,
  },
];

const HERO_BANNER = {
  title: "A quiet gallery, curated one room at a time.",
  subtitle: "On view · Spring",
  description:
    "Canvaso is a curated art house — paintings, sculpture, and contemporary works selected with intention. Step into stillness.",
  image_url: ART.gallery_wall,
  cta_text: "Enter the gallery",
  cta_link: "/collections",
  is_active: true,
  display_order: 1,
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Run                                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

async function step(name, fn) {
  process.stdout.write(`  ${name} … `);
  try {
    const result = await fn();
    console.log("✓");
    return result;
  } catch (err) {
    console.log("✖");
    console.error("    ", err.message || err);
    throw err;
  }
}

async function run() {
  console.log("\n→ Seeding Neon PostgreSQL\n");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

  await step("Verifying gallery tables are empty", async () => {
    const result = await client.query(`
      SELECT
        (SELECT count(*) FROM artists)::int AS artists,
        (SELECT count(*) FROM collections)::int AS collections,
        (SELECT count(*) FROM artworks)::int AS artworks,
        (SELECT count(*) FROM featured_content)::int AS featured_content
    `);
    const counts = result.rows[0];
    if (Object.values(counts).some((count) => count > 0)) {
      throw new Error("Gallery tables already contain data; refusing to overwrite them.");
    }
  });

  const insertObject = async (table, row, returning = "*") => {
    const keys = Object.keys(row);
    const values = keys.map((key) => row[key]);
    const marks = keys.map((_, index) => `$${index + 1}`).join(", ");
    const result = await client.query(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${marks}) RETURNING ${returning}`,
      values,
    );
    return result.rows[0];
  };

  const insertedArtists = await step("Inserting artists", async () => {
    const rows = [];
    for (const artist of ARTISTS) rows.push(await insertObject("artists", artist, "id, name"));
    return rows;
  });
  const artistByName = Object.fromEntries(
    insertedArtists.map((a) => [a.name, a.id])
  );

  // --- 3. Collections ---
  const insertedCollections = await step("Inserting collections", async () => {
    const rows = [];
    for (const collection of COLLECTIONS) rows.push(await insertObject("collections", collection, "id, title"));
    return rows;
  });
  const collectionByTitle = Object.fromEntries(
    insertedCollections.map((c) => [c.title, c.id])
  );

  // --- 4. Artworks ---
  const artworkRows = ARTWORKS.map(({ artist, collection, ...rest }) => ({
    is_featured: false,
    is_available: true,
    ...rest,
    artist_id: artistByName[artist] || null,
    collection_id: collectionByTitle[collection] || null,
  }));
  await step(`Inserting ${artworkRows.length} artworks`, async () => {
    for (const artwork of artworkRows) await insertObject("artworks", artwork);
  });

  // --- 5. Hero banner ---
  await step("Inserting homepage banner", async () => {
    await insertObject("featured_content", HERO_BANNER);
  });

    await client.query("COMMIT");

  console.log(`
✓ Seed complete.

  Artists       ${insertedArtists.length}
  Collections   ${insertedCollections.length}
  Artworks      ${artworkRows.length}
  Hero banners  1

  Visit your homepage to see the new content.
`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

run().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
}).finally(() => pool.end());
