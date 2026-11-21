// Hand-built analogy, classification, and logic items.
// correct is the only fitting choice. wrongs are close but fail the relationship.

const analogies = [
  ["pen", "write", "oven", "bake", "A tool is matched with the action it is used for.", ["kitchen", "heat", "bread"]],
  ["bird", "nest", "bee", "hive", "A creature is matched with the home it builds.", ["honey", "sting", "flower"]],
  ["glove", "hand", "sock", "foot", "Clothing is matched with the body part it covers.", ["shoe", "warm", "walk"]],
  ["pilot", "airplane", "captain", "ship", "A person is matched with the vehicle that person guides.", ["ocean", "sail", "uniform"]],
  ["painter", "brush", "carpenter", "hammer", "A worker is matched with a main tool.", ["wood", "house", "nail"]],
  ["chapter", "book", "scene", "play", "A small part is matched with the whole work.", ["actor", "stage", "line"]],
  ["puppy", "dog", "calf", "cow", "A young animal is matched with the adult.", ["farm", "milk", "bull"]],
  ["scale", "weight", "thermometer", "temperature", "A tool is matched with what it measures.", ["fever", "doctor", "weather"]],
  ["key", "lock", "password", "account", "A secret opener is matched with what it opens.", ["computer", "letter", "door"]],
  ["leaf", "tree", "petal", "flower", "A part is matched with the plant it belongs to.", ["garden", "scent", "stem"]],
  ["minute", "hour", "month", "year", "A smaller unit of time is matched with a larger one.", ["clock", "day", "calendar"]],
  ["whisper", "shout", "stroll", "sprint", "A quiet or slow action is matched with its stronger form.", ["walk", "voice", "race"]],
  ["teacher", "school", "doctor", "hospital", "A worker is matched with the usual workplace.", ["nurse", "medicine", "class"]],
  ["flour", "bread", "wood", "paper", "A raw material is matched with a product made from it.", ["tree", "oven", "write"]],
  ["wheel", "bicycle", "wing", "airplane", "A part that helps movement is matched with the vehicle.", ["bird", "sky", "engine"]],
  ["map", "geography", "timeline", "history", "A display is matched with the subject it organizes.", ["clock", "atlas", "date"]],
  ["thirsty", "water", "hungry", "food", "A need is matched with what satisfies it.", ["plate", "eat", "tired"]],
  ["author", "novel", "composer", "symphony", "A creator is matched with a long work.", ["song", "piano", "poem"]],
  ["lens", "camera", "needle", "compass", "A small part is matched with the instrument that uses it.", ["sew", "photo", "direction"]],
  ["collar", "shirt", "brim", "hat", "A part is matched with the clothing item.", ["head", "neck", "coat"]],
  ["seed", "plant", "egg", "bird", "A beginning form is matched with what grows from it.", ["nest", "feather", "tree"]],
  ["conductor", "orchestra", "coach", "team", "A leader is matched with the group that is led.", ["whistle", "music", "player"]],
  ["ink", "pen", "lead", "pencil", "The writing material is matched with the tool that holds it.", ["paper", "write", "eraser"]],
  ["fin", "fish", "hoof", "horse", "A body part used for movement is matched with the animal.", ["swim", "ride", "tail"]],
  ["library", "books", "museum", "artifacts", "A building is matched with what it keeps for visitors.", ["quiet", "paint", "history"]],
  ["chef", "kitchen", "mechanic", "garage", "A worker is matched with the workroom.", ["car", "food", "tool"]],
  ["rain", "umbrella", "cold", "coat", "A weather problem is matched with the protection.", ["cloud", "winter", "boot"]],
  ["poet", "poem", "playwright", "drama", "A writer is matched with the form that writer creates.", ["stage", "rhyme", "actor"]],
  ["oar", "rowboat", "pedal", "bicycle", "The part a person pushes is matched with the vehicle.", ["lake", "wheel", "ride"]],
  ["thermometer", "fever", "odometer", "distance", "A meter is matched with what it records.", ["car", "sick", "speed"]],
  ["brick", "wall", "page", "book", "A unit is matched with the thing built from many of them.", ["read", "house", "paper"]],
  ["lamb", "sheep", "fawn", "deer", "The young is matched with the adult animal.", ["forest", "wool", "baby"]],
  ["salty", "pretzel", "sour", "lemon", "A taste is matched with a food known for it.", ["sweet", "snack", "yellow"]],
  ["judge", "court", "umpire", "field", "An official is matched with the place of the contest.", ["law", "ball", "whistle"]],
  ["root", "tree", "foundation", "house", "The supporting base is matched with the structure.", ["leaf", "door", "ground"]],
  ["chorus", "sing", "cast", "act", "A performing group is matched with its action.", ["play", "song", "stage"]],
  ["desert", "dry", "swamp", "wet", "A place is matched with its typical condition.", ["sand", "frog", "hot"]],
  ["scissors", "cut", "broom", "sweep", "A tool is matched with its action.", ["hair", "floor", "dust"]],
  ["cub", "lion", "joey", "kangaroo", "The young is matched with the adult.", ["zoo", "pouch", "bear"]],
  ["clock", "time", "scale", "weight", "An instrument is matched with the quantity it measures.", ["hour", "heavy", "number"]],
  ["portrait", "person", "landscape", "place", "A picture type is matched with its subject.", ["paint", "frame", "artist"]],
  ["vein", "leaf", "street", "city", "A branching line is matched with the larger thing it crosses.", ["tree", "car", "blood"]],
  ["baker", "bread", "potter", "bowl", "A maker is matched with a typical product.", ["oven", "clay", "flour"]],
  ["cowardly", "brave", "stingy", "generous", "A trait is matched with its opposite.", ["money", "fear", "kind"]],
  ["beginner", "expert", "apprentice", "master", "A learner is matched with the skilled person that learner may become.", ["job", "teacher", "tool"]],
  ["drought", "rain", "famine", "food", "A shortage is matched with the thing that is missing.", ["desert", "hungry", "farm"]],
  ["helmet", "head", "kneepad", "knee", "Protective gear is matched with the body part.", ["bike", "sport", "arm"]],
  ["chorus", "choir", "troupe", "actors", "Wait this duplicates", ["a", "b", "c"]],
];

// Remove the accidental last bad item by filtering below.
const groups = [
  [["violin", "flute", "drum"], "easel", "The others are musical instruments. An easel holds a painting."],
  [["oak", "maple", "pine"], "tulip", "The others are trees. A tulip is a flower."],
  [["nickel", "dime", "quarter"], "dollar", "The others are coins. A dollar bill is paper money."],
  [["circle", "triangle", "square"], "cube", "The others are flat shapes. A cube is solid."],
  [["red", "blue", "yellow"], "purple", "The others are primary colors. Purple is mixed from red and blue."],
  [["soccer", "basketball", "tennis"], "chess", "The others are sports played with a ball. Chess is a board game."],
  [["fork", "spoon", "knife"], "plate", "The others are utensils you hold to eat. A plate holds the food."],
  [["January", "March", "July"], "Monday", "The others are months. Monday is a day of the week."],
  [["shark", "trout", "salmon"], "dolphin", "The others are fish. A dolphin is a mammal."],
  [["poem", "novel", "essay"], "palette", "The others are kinds of writing. A palette holds paint."],
  [["addition", "subtraction", "multiplication"], "radius", "The others are operations. A radius is a line in a circle."],
  [["jacket", "scarf", "mitten"], "sandal", "The others are worn for cold. A sandal is open footwear for warm weather."],
  [["mercury", "venus", "mars"], "moon", "The others are planets. The moon is a satellite of Earth."],
  [["hammer", "saw", "wrench"], "canvas", "The others are tools. Canvas is a cloth surface."],
  [["happy", "joyful", "glad"], "furious", "The others name pleasant feelings. Furious names anger."],
  [["river", "lake", "ocean"], "canyon", "The others are bodies of water. A canyon is a deep valley."],
  [["inch", "foot", "yard"], "pound", "The others measure length. A pound measures weight."],
  [["beak", "feather", "wing"], "paw", "The others are bird features. A paw belongs to a four-legged animal."],
  [["senate", "house", "congress"], "jury", "The others are parts of the lawmaking branch. A jury decides a trial."],
  [["breakfast", "lunch", "dinner"], "napkin", "The others are meals. A napkin is a table item."],
  [["triangle", "pentagon", "hexagon"], "oval", "The others are polygons with straight sides. An oval is curved."],
  [["whisper", "murmur", "mumble"], "bellow", "The others are quiet ways of speaking. A bellow is loud."],
  [["copper", "iron", "aluminum"], "granite", "The others are metals. Granite is a rock."],
  [["noun", "verb", "adjective"], "paragraph", "The others are parts of speech. A paragraph is a group of sentences."],
  [["seed", "root", "stem"], "hive", "The others are plant parts. A hive is a bee home."],
  [["plus", "minus", "times"], "equal", "The others are operations. An equal sign shows a relation, not an operation."],
  [["canoe", "kayak", "raft"], "sled", "The others travel on water. A sled travels on snow."],
  [["sonnet", "haiku", "limerick"], "novel", "The others are short poem forms. A novel is a long prose book."],
  [["Celsius", "Fahrenheit", "Kelvin"], "gallon", "The others are temperature scales. A gallon measures volume."],
  [["autobiography", "memoir", "diary"], "fable", "The others tell a real person's life. A fable is a made-up story with a moral."],
  [["perimeter", "circumference", "border"], "area", "The others name a distance around. Area names the space inside."],
  [["pacific", "atlantic", "indian"], "nile", "The others are oceans. The Nile is a river."],
  [["senator", "representative", "legislator"], "defendant", "The others make laws. A defendant is a person on trial."],
  [["fraction", "decimal", "percent"], "pronoun", "The others name ways to write numbers. A pronoun is a word."],
  [["eclipse", "orbit", "gravity"], "stanza", "The others are space or physics ideas. A stanza is part of a poem."],
  [["carpenter", "plumber", "electrician"], "audience", "The others are skilled trades. An audience watches."],
  [["metaphor", "simile", "personification"], "index", "The others are figures of speech. An index is a book list."],
  [["hydrogen", "oxygen", "nitrogen"], "granite", "The others are gases in air or elements that are gases. Granite is rock."],
  [["prologue", "chapter", "epilogue"], "easel", "The others are parts of a book. An easel holds art."],
  [["clockwise", "counterclockwise", "rotation"], "diameter", "The others describe turning. A diameter is a length across a circle."]
];

const logic = [
  {
    stem: "All sparrows are birds. All birds have feathers. Which must be true?",
    correct: "All sparrows have feathers.",
    wrongs: ["All feathered animals are sparrows.", "Some birds are not animals.", "No sparrow has feathers."],
    explanation: "If every sparrow is a bird and every bird has feathers, every sparrow has feathers."
  },
  {
    stem: "If the bus is late, Maya walks. Today Maya did not walk. Which must be true?",
    correct: "The bus was not late.",
    wrongs: ["The bus was late.", "Maya does not know the route.", "Maya always walks."],
    explanation: "The contrapositive of 'if late, then walk' is 'if she did not walk, then the bus was not late.'"
  },
  {
    stem: "No rectangles are triangles. This figure is a rectangle. Which must be true?",
    correct: "This figure is not a triangle.",
    wrongs: ["This figure is a triangle.", "All rectangles are squares.", "This figure has three sides."],
    explanation: "A thing in a group that shares nothing with triangles cannot be a triangle."
  },
  {
    stem: "Every student in the chess club plays on Tuesday. Omar plays only on Friday. Which must be true?",
    correct: "Omar is not in the chess club.",
    wrongs: ["Omar is the club president.", "Omar plays on Tuesday.", "The club meets on Friday."],
    explanation: "If he never plays on Tuesday, he cannot be in a club that always plays that day."
  },
  {
    stem: "Some of the muffins are blueberry. All of the muffins are homemade. Which must be true?",
    correct: "Some homemade muffins are blueberry.",
    wrongs: ["All homemade muffins are blueberry.", "No muffin is homemade.", "Every blueberry muffin was bought at a store."],
    explanation: "The blueberry muffins are a some-group inside the homemade muffins, so some homemade muffins are blueberry."
  },
  {
    stem: "If a number is divisible by 6, then it is divisible by 3. 14 is not divisible by 3. Which must be true?",
    correct: "14 is not divisible by 6.",
    wrongs: ["14 is divisible by 6.", "14 is divisible by 3.", "Every number divisible by 3 is divisible by 6."],
    explanation: "If 14 were divisible by 6, it would have to be divisible by 3. It is not, so it is not divisible by 6."
  },
  {
    stem: "All of the locks on this gate need a key. This latch has no keyhole. Which must be true?",
    correct: "This latch is not one of the locks on this gate.",
    wrongs: ["This latch needs a key.", "Every latch is a lock.", "The gate has no locks."],
    explanation: "The gate locks all need keys. A latch with no place for a key cannot be one of those locks."
  },
  {
    stem: "Nobody who missed rehearsal is in the opening scene. Priya is in the opening scene. Which must be true?",
    correct: "Priya did not miss rehearsal.",
    wrongs: ["Priya missed rehearsal.", "Priya is not in the scene.", "Everyone who rehearsed is in the opening scene."],
    explanation: "If she were someone who missed rehearsal, she could not be in the scene. She is in it, so she did not miss rehearsal."
  },
  {
    stem: "All prime numbers greater than 2 are odd. 2 is prime. Which must be true?",
    correct: "2 is not an odd prime greater than 2.",
    wrongs: ["2 is odd.", "2 is not prime.", "All odd numbers are prime."],
    explanation: "The rule is only about primes greater than 2. 2 is prime, but it is not greater than 2, and it is even."
  },
  {
    stem: "If the trail is icy, the hike is canceled. The hike was canceled. Which must be true?",
    correct: "It is not certain from these facts that the trail was icy.",
    wrongs: ["The trail must have been icy.", "The hike was not canceled.", "The trail cannot be icy."],
    explanation: "Canceling follows from ice, but other causes could cancel the hike too. 'If P then Q' plus Q does not prove P."
  },
  {
    stem: "Each jacket in the lost-and-found is blue or gray. This jacket is not blue. It is in the lost-and-found. Which must be true?",
    correct: "This jacket is gray.",
    wrongs: ["This jacket is blue.", "This jacket is red.", "This jacket is not in the lost-and-found."],
    explanation: "It has to be one of the two colors, and it is not blue, so it is gray."
  },
  {
    stem: "All of the vowels in this puzzle are circled. The letter T is not circled. Which must be true?",
    correct: "T is not a vowel in this puzzle.",
    wrongs: ["T is a vowel in this puzzle.", "T is circled.", "No letter is circled."],
    explanation: "If T were one of those vowels, it would be circled. It is not circled, so it is not one of them."
  },
  {
    stem: "Whenever the score is tied after four quarters, the teams play overtime. These teams did not play overtime. Which must be true?",
    correct: "The score was not tied after four quarters.",
    wrongs: ["The score was tied after four quarters.", "The teams played overtime.", "A tie is impossible."],
    explanation: "If the score had been tied, overtime would have happened. It did not, so the score was not tied."
  },
  {
    stem: "Every multiple of 10 is a multiple of 5. 25 is a multiple of 5. Which must be true?",
    correct: "It does not follow that 25 is a multiple of 10.",
    wrongs: ["25 must be a multiple of 10.", "25 is not a multiple of 5.", "No multiple of 5 is a multiple of 10."],
    explanation: "All multiples of 10 are multiples of 5, but not the reverse. 25 is a multiple of 5 and not of 10."
  },
  {
    stem: "No member of the swim team missed the bus. Chris missed the bus. Which must be true?",
    correct: "Chris is not on the swim team.",
    wrongs: ["Chris is on the swim team.", "Chris did not miss the bus.", "The whole team missed the bus."],
    explanation: "If Chris were on the team, he would not have missed the bus. He did miss it, so he is not on the team."
  },
  {
    stem: "All of the red folders are on the top shelf. This folder is on the bottom shelf. Which must be true?",
    correct: "This folder is not a red folder.",
    wrongs: ["This folder is red.", "This folder is on the top shelf.", "No folder is red."],
    explanation: "Every red folder is on top. A folder on the bottom cannot be one of the red ones."
  },
  {
    stem: "If a polygon has 4 equal sides and 4 right angles, it is a square. This polygon has 4 equal sides but no right angles. Which must be true?",
    correct: "This polygon does not meet the test given for a square.",
    wrongs: ["This polygon must be a square.", "This polygon has 4 right angles.", "Equal sides always make right angles."],
    explanation: "The rule needs both equal sides and right angles. Missing the right angles means that rule does not call it a square."
  },
  {
    stem: "Some of the band members play trumpet. All trumpet players in the band practice on Monday. Which must be true?",
    correct: "Some band members practice on Monday.",
    wrongs: ["Every band member plays trumpet.", "No band member practices on Monday.", "Only drummers practice on Monday."],
    explanation: "There is at least one trumpet player in the band, and those players practice on Monday, so some band members do."
  },
  {
    stem: "Either the gate is locked or the sign is missing, but not both. The sign is missing. Which must be true?",
    correct: "The gate is not locked.",
    wrongs: ["The gate is locked.", "The sign is not missing.", "Both can be true together."],
    explanation: "Exactly one of the two is true. The sign is missing, so the gate is not locked."
  },
  {
    stem: "All of the poems in this packet rhyme. This writing does not rhyme. Which must be true?",
    correct: "This writing is not a poem in this packet.",
    wrongs: ["This writing is a poem in this packet.", "Nothing in the packet rhymes.", "This writing must rhyme."],
    explanation: "Packet poems all rhyme. A piece that does not rhyme is outside that group."
  },
  {
    stem: "If the printer is out of paper, it stops. The printer did not stop. Which must be true?",
    correct: "The printer was not out of paper.",
    wrongs: ["The printer was out of paper.", "The printer stopped.", "Paper always jams."],
    explanation: "If it had been out of paper, it would have stopped. It did not stop, so it was not out of paper."
  },
  {
    stem: "No even number greater than 2 is prime. 9 is not even. Which must be true?",
    correct: "The given facts do not say whether 9 is prime.",
    wrongs: ["9 must be prime.", "9 must be even.", "9 cannot be odd."],
    explanation: "The rule only removes even numbers greater than 2 from the primes. 9 is odd, so this rule does not decide it. (9 is not prime, but that fact is not in the statements.)"
  },
  {
    stem: "All club officers attend the morning meeting. Rita attends the morning meeting. Which must be true?",
    correct: "It does not follow that Rita is a club officer.",
    wrongs: ["Rita must be a club officer.", "Rita missed the meeting.", "No officer attends the meeting."],
    explanation: "Officers attend, but other people might attend too. Being there does not prove she is an officer."
  },
  {
    stem: "Each question on this quiz has one best answer. This item has one best answer. Which must be true?",
    correct: "This item fits the quiz rule about having one best answer.",
    wrongs: ["This item has no best answer.", "Every sentence is a quiz question.", "This item has four best answers."],
    explanation: "The rule says each quiz question has one best answer, and this item has one, so it fits that rule."
  }
];

module.exports = {
  analogies: analogies.filter((row) => row[1] !== "choir"),
  groups,
  logic
};
