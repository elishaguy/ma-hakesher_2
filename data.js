/* Generic demo game, shown when someone clicks "נסו משחק לדוגמה" on the home
   page. This uses the exact same data shape that create.html generates, so it
   also doubles as a real-world example of the format. Kept intentionally
   generic (no one's personal boards) since this is what any visitor sees. */

const DEMO_DATA = {
  title: "משחק לדוגמה",
  note: "זהו משחק לדוגמה כדי שתראו איך זה נראה. לחצו על \"צרו משחק משלכם\" בעמוד הבית כדי להכין לוח אישי משלכם.",
  createdBy: "",
  tries: 5,
  boards: [
    {
      level: "easy",
      categories: [
        { title: "פירות", words: ["תפוח", "בננה", "אגס", "ענב"] },
        { title: "ערי בירה באסיה", words: ["טוקיו", "בייג'ינג", "סאול", "בנגקוק"] },
        { title: "רכסי הרים", words: ["האלפים", "ההימלאיה", "האנדים", "הרוקי"] },
        { title: "מותגי נעלי הליכה", words: ["מרל", "סלומון", "קיין", "הוקה"] },
      ],
      clue: ["מרל", "סלומון"],
    },
    {
      level: "hard",
      categories: [
        { title: "ראשי מפלגת העבודה", words: ["מיכאלי", "מאיר", "מצנע", "גבאי"] },
        { title: "ככרות מפורסמות בישראל", words: ["רבין", "הבימה", "דיזינגוף", "פריז"] },
        { title: "ערים באירופה שדוברות גרמנית", words: ["ציריך", "ברלין", "וינה", "ואדוץ"] },
        { title: "זוכי פרס נובל ישראלים", words: ["פרס", "עגנון", "בגין", "מוקיר"] },
      ],
      clue: ["דיזינגוף", "פריז"],
    },
  ],
};
