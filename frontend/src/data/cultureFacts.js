// Short culture facts shown in Culture Mode (child dashboard, learn home).
// Written with qualifiers ("many", "often") because families celebrate
// in different ways. Content team: please review before adding more.

export const cultureFacts = [
  {
    title: "A flag with two points",
    text: "Nepal's flag is made of two stacked triangles. It is the only national flag in the world that is not a rectangle.",
  },
  {
    title: "Sagarmatha",
    text: "The world's highest mountain, known in English as Mount Everest, is called Sagarmatha in Nepali.",
  },
  {
    title: "Dashain",
    text: "Dashain is one of the biggest festivals in Nepal. Many families gather, and elders give tika and blessings to younger relatives.",
  },
  {
    title: "Tihar, the festival of lights",
    text: "During Tihar, many families light oil lamps and honour crows, dogs and cows. On Bhai Tika, sisters bless their brothers.",
  },
  {
    title: "Namaste",
    text: "Many people greet each other by pressing their palms together and saying नमस्ते (namaste).",
  },
  {
    title: "Dal bhat",
    text: "Dal bhat, lentil soup with rice, is an everyday meal in many Nepali homes, often served with vegetables and pickle.",
  },
  {
    title: "A different calendar",
    text: "Nepal officially uses the Bikram Sambat calendar, which is about 56 to 57 years ahead of the calendar used in many other countries.",
  },
  {
    title: "Many languages",
    text: "Nepali is the most widely spoken language in Nepal, but people across the country speak more than one hundred languages.",
  },
  {
    title: "Lumbini",
    text: "Lumbini, in southern Nepal, is known as the birthplace of Siddhartha Gautama, the Buddha.",
  },
  {
    title: "Devanagari",
    text: "Nepali is written in Devanagari script, the same script used for Hindi and Sanskrit.",
  },
];

// Same fact all day, a new one tomorrow.
export function factOfTheDay(date = new Date()) {
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return cultureFacts[dayNumber % cultureFacts.length];
}
