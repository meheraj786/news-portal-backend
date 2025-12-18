
import { Types } from "mongoose";
import { NavMenu } from "../models/navMenu";

export const seedNavMenu = async () => {
  try {
    const existingNavMenu = await NavMenu.findOne();

    if (existingNavMenu) {
      console.log("✅ NavMenu already exists. Seeder skipped.");
      return;
    }

    const initialCategoryIds: Types.ObjectId[] = [];

    await NavMenu.create({
      categoryIds: initialCategoryIds,
    });

    console.log("🚀 NavMenu seeded successfully.");
  } catch (error) {
    console.error("❌ Failed to seed NavMenu:", error);
  }
};
