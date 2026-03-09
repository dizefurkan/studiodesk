// Test script to debug course update
const courseId = "33ab6862-a32c-4205-ab58-ecb5c91b2c05";
const updatePayload = {
  name: "Pazartesi 19:00 Sinifi",
  dayOfWeek: 1,
  startTime: "17:13",
  endTime: "19:00",
  capacity: 20,
  instructorIds: ["7b528659-df76-4b6d-98ff-7573a6e373fc"]
};

console.log("Test payload for course update:");
console.log("Course ID:", courseId);
console.log("Update data:", JSON.stringify(updatePayload, null, 2));
