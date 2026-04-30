const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://wwwqmcsnskopyhxskcha.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d3FtY3Nuc2tvcHloeHNrY2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE5ODgyNSwiZXhwIjoyMDczNzc0ODI1fQ.b6noYcjJDmISlD3g5F9vrc1GRFTgbMqqz8SbKKGyFyM";

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setCEORole(userEmail) {
  try {
    console.log(`Setting CEO role for user: ${userEmail}`);

    // Update the user's role to 'ceo'
    const { data, error } = await supabase
      .from("users")
      .update({ role: "ceo" })
      .eq("email", userEmail)
      .select();

    if (error) {
      console.error("Error updating user role:", error);
      return false;
    }

    if (data && data.length > 0) {
      console.log("✅ Successfully updated user role to CEO:");
      console.log(data[0]);
      return true;
    } else {
      console.log("❌ User not found with email:", userEmail);
      return false;
    }
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

async function listAllUsers() {
  try {
    console.log("📋 All users in the database:");

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    if (data && data.length > 0) {
      data.forEach((user, index) => {
        console.log(
          `${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`
        );
      });
    } else {
      console.log("No users found in database");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("📋 Usage:");
    console.log("node set-ceo-role.js <user-email>    # Set user as CEO");
    console.log("node set-ceo-role.js --list          # List all users");
    console.log("");

    // Show all users by default
    await listAllUsers();
    return;
  }

  if (args[0] === "--list") {
    await listAllUsers();
    return;
  }

  const userEmail = args[0];
  const success = await setCEORole(userEmail);

  if (success) {
    console.log("");
    console.log("🎉 User role updated successfully!");
    console.log("You can now access the admin panel at /admin");
    console.log("Please refresh your browser and try logging in again.");
  }
}

main().catch(console.error);
