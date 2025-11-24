// Test script to verify the new models work correctly

const { Exhibitions, FestivalsEvents } = require("../../models");

async function testModels() {
  try {
    // Test creating an exhibition
    console.log("Testing Exhibitions model...");
    const exhibition = await Exhibitions.create({
      placeAr: "مكان المعرض بالعربية",
      placeEn: "Exhibition Place in English",
      latitude: 33.5138,
      longitude: 36.2765,
      dateTime: new Date(),
      descriptionAr: "وصف المعرض بالعربية",
      descriptionEn: "Exhibition description in English",
      media: [],
      officialSupporterAr: "الداعم الرسمي بالعربية",
      officialSupporterEn: "Official Supporter in English",
      durationAr: "3 أيام",
      durationEn: "3 days",
      cost: 100.50,
      targetAudienceAr: "الجمهور المستهدف بالعربية",
      targetAudienceEn: "Target Audience in English",
      notesAr: "ملاحظات بالعربية",
      notesEn: "Notes in English"
    });
    console.log("Created exhibition:", exhibition.id);

    // Test creating a festival/event
    console.log("Testing FestivalsEvents model...");
    const festivalEvent = await FestivalsEvents.create({
      placeAr: "مكان المهرجان بالعربية",
      placeEn: "Festival Place in English",
      latitude: 33.5138,
      longitude: 36.2765,
      dateTime: new Date(),
      descriptionAr: "وصف المهرجان بالعربية",
      descriptionEn: "Festival description in English",
      media: [],
      officialSupporterAr: "الداعم الرسمي بالعربية",
      officialSupporterEn: "Official Supporter in English",
      durationAr: "5 أيام",
      durationEn: "5 days",
      cost: 200.75,
      targetAudienceAr: "الجمهور المستهدف بالعربية",
      targetAudienceEn: "Target Audience in English",
      notesAr: "ملاحظات بالعربية",
      notesEn: "Notes in English"
    });
    console.log("Created festival/event:", festivalEvent.id);

    console.log("All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

testModels();