export const validateEnv = () => {
  // List all the variables you absolutely NEED
  const requiredEnv = [
    "NODE_ENV",
    "DB_URL",
    "JWT_SECRET",
    "EMAIL_FROM_ADDRESS",
    "EMAIL_APP_PASSWORD",
    "BASE_URL",
    "APP_NAME",
    "ADMIN_EMAIL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "PORT",
    "CLIENT_URL",
  ];

  const missingKeys: string[] = [];

  // Check each one
  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      missingKeys.push(key);
    }
  });

  // If any are missing, crash the app with a clear list
  if (missingKeys.length > 0) {
    console.error("❌ FATAL ERROR: Missing required environment variables:");
    missingKeys.forEach((key) => console.error(`   - ${key}`));

    // Exit the process (1 = failure)
    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully.");
};
