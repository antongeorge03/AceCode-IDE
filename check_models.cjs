// check_models.cjs
require("dotenv").config({ path: ".env.local" });

async function check() {
  const key = process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.log("❌ No VITE_GEMINI_API_KEY found in .env.local");
    return;
  }

  console.log(`Checking API Key starting with: ${key.substring(0, 5)}...`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );
    const data = await response.json();

    if (data.error) {
      console.error("\n❌ API KEY ERROR:");
      console.error(data.error.message);
      console.log(
        "\n👉 If the error says 'API key not valid', check your .env.local file.",
      );
      console.log(
        "👉 If the error says 'Generative Language API has not been used', you need to enable it in Google Cloud Console.",
      );
      return;
    }

    console.log(
      "\n✅ SUCCESS! Your key works. These are the valid model names you can use:",
    );
    const chatModels = data.models.filter((m) =>
      m.supportedGenerationMethods.includes("generateContent"),
    );

    chatModels.forEach((m) => {
      // We only care about the part after "models/"
      console.log(` - "${m.name.replace("models/", "")}"`);
    });
  } catch (err) {
    console.error("Network Error:", err);
  }
}

check();
