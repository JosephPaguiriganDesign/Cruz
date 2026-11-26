// Extra original reading passages. Questions are checked by hand.
// Loaded in addition to the built bank so existing question ids stay put.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HSPT_EXTRA = api;
})(typeof window !== "undefined" ? window : null, function () {
  function shuffle(arr, seed) {
    var a = seed >>> 0;
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      a = (a * 1664525 + 1013904223) >>> 0;
      var j = Math.floor((a / 4294967296) * (i + 1));
      var t = copy[i];
      copy[i] = copy[j];
      copy[j] = t;
    }
    return copy;
  }

  function P(id, title, text, rows) {
    return { id: id, title: title, text: text, rows: rows };
  }

  var passages = [
    P("p13", "Headlamps",
      "The night hike was not a race. Ms. Okonkwo said it twice at the trailhead, and she made the eighth graders repeat it. Each student wore a headlamp with fresh batteries. The rule was simple: stay between the two teachers, and keep the light on the path, not in a friend's eyes.\n\nTen minutes in, Jonah's lamp flickered. He did not announce it. He watched Andre's heels and hoped. When the beam died, he stopped, which was the right instinct and the wrong silence. Priya, just behind him, bumped his pack and said his name. Ms. Okonkwo's whistle answered. She swapped in a spare lamp from her jacket, then asked Jonah why he had waited. He said he did not want to slow the line. She said a dark gap in the line was slower than a ten-second stop.\n\nThey finished the loop. At the parking lot Jonah still felt foolish, but he also had the spare lamp in his hand and a clearer rule than the one printed on the permission slip.",
      [
        ["What is the passage mainly about?", "Jonah learning that a short stop is safer than hiding a dead lamp.", ["A race down a mountain.", "How batteries are manufactured.", "Why Priya dislikes hiking."], "The story turns on Jonah's silence and the teacher's point that a dark gap slows everyone."],
        ["What were students told to do with their lights?", "Point them at the path, not at other people's eyes.", ["Turn them off to see the stars.", "Shine them only at the teachers.", "Leave them in the bus."], "The rule says to keep the light on the path, not in a friend's eyes."],
        ["Why did Jonah keep quiet when the lamp flickered?", "He hoped he could follow without slowing the group.", ["The whistle was too loud.", "Priya told him not to speak.", "He had no permission slip."], "He watched Andre's heels and later said he did not want to slow the line."],
        ["What can you infer about Ms. Okonkwo's spare lamp?", "She expected that someone might need a backup.", ["She had never hiked at night.", "It belonged to the bus driver.", "It was the prize for finishing first."], "She carried a spare in her jacket and used it at once, which shows she planned for a failure."],
        ["In this passage, gap means", "a break in the line of hikers.", ["a store discount.", "a hole in a tooth.", "a type of battery."], "A dark gap in the line is the space created when Jonah stopped without warning."],
        ["The author's purpose is to", "show why speaking up on a hike matters.", ["teach how to build a headlamp.", "argue that night hikes should be banned.", "compare two mountains."], "The scene ends with a clearer safety rule, not a product manual or a ban."]
      ]),
    P("p14", "The posted limit",
      "The footbridge in Creekside Park can hold more than one person. The sign still says 'Limit 8 people.' A visitor complained that the number was an insult to a bridge made of steel. The park engineer, Mr. Shah, posted a plain explanation beside the sign.\n\nThe limit is not the weight of the steel on a calm day. It is the weight the bridge can carry after rain has soaked the deck, after years of rust at the bolts, and while people walk in step. Walking in step makes a small bounce. Eight people bouncing together are a harder test than eight people standing still. Wind adds another push the sign cannot see.\n\nMr. Shah ended with a sentence the complainer did not expect: the limit is also for the day the bridge is older than it is today. A rule that is a little strict now is what keeps the same boards usable later.",
      [
        ["What is the main idea?", "The bridge limit allows for wear, weather, and people moving together.", ["Steel is too weak for parks.", "Signs should never give numbers.", "Mr. Shah wants the bridge removed."], "The explanation lists rain, rust, walking in step, wind, and future age."],
        ["According to the passage, walking in step", "makes the bridge bounce more.", ["dries the deck.", "removes rust.", "lowers the wind."], "Walking in step makes a small bounce, and bouncing is a harder test than standing still."],
        ["Why does Mr. Shah mention the bridge's future age?", "A stricter limit now helps the bridge last.", ["He plans to replace the steel tomorrow.", "The complainer owns the bolts.", "Rain cannot fall in later years."], "He says a slightly strict rule keeps the boards usable later."],
        ["The visitor thought the limit was an insult because", "the bridge is steel and seemed stronger than eight people.", ["the sign was missing.", "eight is an unlucky number.", "the park was closed."], "The visitor said the number insulted a bridge made of steel."],
        ["In this passage, strict means", "more cautious than the easiest case.", ["rude to visitors.", "made of wood.", "impossible to read."], "A rule that is a little strict now is tighter than what a brand-new calm day would allow."],
        ["The author's purpose is to", "explain the reasoning behind a safety limit.", ["persuade people to run across the bridge.", "describe Mr. Shah's childhood.", "compare steel with gold."], "The passage is an explanation of the posted number."]
      ]),
    P("p15", "Live in the pit",
      "Dear Director Alvarez,\n\nI am writing to ask that the spring musical keep a student band in the pit. A recorded track is cheaper and never misses an entrance. It also never listens. Last year, when the lead singer lost a line, the track rolled on. The pit band would have stretched four measures and met her at the chorus.\n\nA live band is part of the show the audience buys a ticket to see. Students who play flute, drum, and bass are doing homework as real as memorizing lines. If the worry is volume, we can rehearse with the doors closed and mark the loud pages. If the worry is time, we can start ten minutes earlier on Wednesdays.\n\nI am not asking for a larger budget. I am asking you not to replace musicians with a file. A file cannot watch the stage.\n\nSincerely,\nElena Voss, eighth grade",
      [
        ["What does Elena want?", "A student band to play live during the musical.", ["A larger budget for costumes.", "The lead singer to be replaced.", "Wednesday rehearsals to be canceled."], "The letter asks the director to keep a student band in the pit."],
        ["What happened last year when the singer lost a line?", "The recorded track kept going.", ["The band stretched four measures.", "The audience left.", "The director stopped the file."], "Elena says the track rolled on, while a pit band could have waited."],
        ["Which worry does Elena answer with an earlier Wednesday start?", "Time.", ["Volume.", "Ticket prices.", "A missing flute."], "She writes, if the worry is time, start ten minutes earlier on Wednesdays."],
        ["Elena says a recorded track never", "listens or watches the stage.", ["costs money.", "plays the right notes.", "fits on a computer."], "She says it never listens, and a file cannot watch the stage."],
        ["The phrase doing homework as real as memorizing lines suggests that", "playing in the pit is serious schoolwork.", ["musicians should skip math.", "lines do not need practice.", "homework is only worksheets."], "She puts pit practice on the same level as learning lines."],
        ["The tone of the letter is", "respectful and firm.", ["joking and careless.", "angry and insulting.", "bored and unsure."], "She says Dear Director, answers likely worries, and makes a clear request without insults."]
      ]),
    P("p16", "Away from the roof",
      "The class rain gauge is a clear cylinder with marks in millimeters. It sits on a post in the middle of the soccer field, not under the maple by the gym. People ask why the class walks that far. Ms. Patel's answer is short: roofs lie.\n\nA roof sheds water. In a storm, rain runs off the maple's leaves and falls in a curtain. A gauge under that curtain reports a flood the field never received. A gauge beside a wall can also miss rain, because the wall blocks wind-blown drops. The open post gets the rain that actually lands on the grass.\n\nEach morning a pair of students reads the mark, writes it in the log, and empties the cylinder. They do not round to the nearest centimeter. A week of small numbers is still data. In April the log showed 11 millimeters on a day the gym roof roared. The field had been damp, not drowned. The gauge was doing its job by refusing the roof's exaggeration.",
      [
        ["What is the main idea?", "The gauge is placed in the open so it measures rain that truly reaches the ground.", ["Roofs are the best place to measure rain.", "Students should round to centimeters.", "April had no rain at all."], "The passage explains why the open post is more honest than a spot under a roof or tree."],
        ["Why is a gauge under the maple misleading?", "Leaves dump extra water into it.", ["The maple blocks all rain.", "The cylinder melts.", "Students cannot see millimeters."], "Rain runs off the leaves and falls in a curtain, so the gauge reports a flood the field did not get."],
        ["What do the morning students do after they read the mark?", "They write it in the log and empty the cylinder.", ["They move the gauge under the roof.", "They round to the nearest centimeter.", "They close the soccer field."], "The passage lists reading, writing in the log, and emptying."],
        ["The April example shows that", "the gym roof sounded worse than the field's rainfall.", ["11 millimeters flooded the school.", "the log was left blank.", "the gauge had been under the maple."], "The roof roared, but the field was only damp, and the log said 11 millimeters."],
        ["In this passage, exaggeration means", "making the rainfall seem greater than it was.", ["a mark in millimeters.", "a student who is late.", "a clear cylinder."], "The roof's noise and runoff would overstate the rain the grass received."],
        ["The author's purpose is to", "explain a careful way to measure rain.", ["persuade the school to remove the maple.", "tell a funny story about soccer.", "compare millimeters with inches only."], "The piece teaches why placement and exact reading matter."]
      ]),
    P("p17", "The hook by the meter",
      "Mrs. Alvarez keeps a spare key on a hook beside the electric meter, high enough that a toddler cannot palm it and low enough that she can reach it with a step stool. The key opens her back door. For three years the only person who used it was Mrs. Alvarez, on the days she walked out with the recycling and the latch clicked behind her.\n\nThis October the person was Leo, from next door. Her cat had slipped into the basement while a repair crew held the door. Mrs. Alvarez was at the clinic. Leo's father called her, and she said to use the key, put the cat out, and hang the key back. Leo did those three things in that order. He also wiped his shoes.\n\nThat night Mrs. Alvarez moved nothing. The hook was a test she had not announced. In the morning the key was there. Trust, she told Leo later, is a tool you return.",
      [
        ["What is the passage mainly about?", "Leo using a neighbor's spare key and returning it.", ["How to repair an electric meter.", "A toddler who stole a key.", "Why cats dislike basements."], "The story follows the key from its hook to Leo's errand and back."],
        ["Why did Leo need the key?", "The cat was in the basement and Mrs. Alvarez was away.", ["The recycling bin was locked.", "The clinic asked for a spare.", "The front door had no latch."], "The cat slipped in during a repair, and she was at the clinic."],
        ["What did Mrs. Alvarez tell Leo's father to do with the key?", "Use it, let the cat out, and hang it back.", ["Leave it in the clinic.", "Give it to the repair crew.", "Hide it from Leo."], "Those are the three instructions, and Leo followed them in order."],
        ["Why did Mrs. Alvarez leave the hook unchanged that night?", "She wanted to see whether the key came back.", ["She forgot where the hook was.", "The meter was broken.", "Leo asked her to move it."], "The passage says the hook was a test she had not announced, and in the morning the key was there."],
        ["The sentence trust is a tool you return means", "being trusted includes giving back what you were lent.", ["tools should be stored at the clinic.", "keys are useless.", "cats cannot be trusted."], "She compares trust to the key Leo was supposed to return."],
        ["Which inference is best supported?", "Mrs. Alvarez was willing to trust Leo with her house for a clear job.", ["She planned to change the locks.", "Leo lost the key in the basement.", "The repair crew took the cat home."], "She told them to use the key and later praised the return."]
      ]),
    P("p18", "Same park, two maps",
      "The trail map of Creekside Park is full of dotted lines and small numbers. The numbers are distances in tenths of a mile. Contour lines show where the ground rises. A hiker can see that the east loop climbs, then drops to the creek.\n\nThe street map of the same park is almost empty inside the green shape. It cares about the roads around the park, the parking lots, and the one driveway the bus may use. It does not name the east loop. A family driving there needs that map. A family already standing at the trailhead needs the other.\n\nNeither map is wrong. Each leaves out what its user does not need. The trouble starts when someone tries to hike by the street map and expects the dotted climb to appear between the parking lots. Maps are promises about a task, not photographs of everything.",
      [
        ["What is the main idea?", "Each map is built for a different job, so each leaves different things out.", ["The street map shows every trail.", "Contour lines are parking spaces.", "One of the maps is full of errors."], "The passage says neither map is wrong, and each omits what its user does not need."],
        ["What do the small numbers on the trail map show?", "Distances in tenths of a mile.", ["Bus numbers.", "The price of parking.", "How many trees are in the park."], "The passage says the numbers are distances in tenths of a mile."],
        ["Who needs the street map most, according to the passage?", "A family driving to the park.", ["A hiker already on the east loop.", "A bird watching the creek.", "Someone counting contour lines."], "A family driving there needs the roads, lots, and bus driveway."],
        ["What mistake does the passage warn against?", "Trying to follow trails on the street map.", ["Using tenths of a mile.", "Parking in a lot.", "Reading contour lines."], "Trouble starts when someone hikes by the street map and expects the dotted climb."],
        ["The word promises in the last sentence means", "what the map commits to show for a task.", ["a gift of money.", "a legal contract to buy the park.", "a photograph."], "The sentence contrasts a promise about a task with a photograph of everything."],
        ["A reader can infer that the east loop", "changes elevation.", ["is a highway.", "has no creek nearby.", "is drawn on the street map in red."], "Contour lines show the east loop climbs and then drops to the creek."]
      ]),
    P("p19", "The quiet tables",
      "The cafeteria study began with a complaint, not a theory. Teachers said the room was too loud for the students who still had homework during lunch. The eighth-grade science class borrowed a decibel meter and measured three ordinary days. The average at the center tables was 78 decibels. Conversation there was possible. It was not comfortable for reading.\n\nThe class asked for two tables by the windows to be quiet tables for a week. No speeches. A paper sign and a student who reminded friends once. They measured again. The quiet tables averaged 64 decibels. The center of the room stayed near 77. The quiet did not spread by magic. It stayed where the rule was clear.\n\nThe class did not claim the whole cafeteria was fixed. They claimed something smaller and better: a person who needs to read can now choose a spot where the numbers say reading is reasonable. The principal agreed to keep the signs for the rest of the term and to measure one more week in May.",
      [
        ["What is the main idea?", "A small, measured rule made two tables quiet enough for reading.", ["The whole cafeteria became silent.", "Decibel meters are usually wrong.", "Homework should be banned at lunch."], "The quiet tables dropped to 64 decibels while the center stayed loud, and that smaller claim is what they defended."],
        ["What was the average at the center tables before the experiment?", "78 decibels.", ["64 decibels.", "77 students.", "Three days."], "The passage says the average at the center tables was 78 decibels."],
        ["What happened to the center of the room during the quiet-table week?", "It stayed about as loud as before.", ["It fell to 64 decibels.", "It was closed.", "It became the homework office."], "The center stayed near 77, close to the earlier 78."],
        ["Why does the author say the quiet did not spread by magic?", "The lower noise stayed at the tables with a clear rule.", ["The meter was broken.", "The windows stopped all sound.", "The principal canceled the signs."], "The passage contrasts the quiet tables with the still-loud center."],
        ["Which statement is a fact from the passage?", "The quiet tables averaged 64 decibels.", ["Everyone now enjoys lunch.", "Reading is impossible at 64 decibels.", "May will be the loudest month."], "64 decibels is a reported measurement. The other choices are judgments or guesses."],
        ["The principal's decision suggests that", "the school wants to check whether the result lasts.", ["the meters will be thrown away.", "quiet tables are canceled.", "homework is moving to the gym."], "The signs stay for the term, and another measurement is planned for May."]
      ]),
    P("p20", "The list on the fridge",
      "Before the math tournament, Cruz's mother put a list on the fridge. It was not a speech. It was eight lines: pencils, eraser, sharpener, water, snack, permission slip, inhaler, sweatshirt. Cruz packed from the list and not from memory. Memory had already failed him in October, when he arrived with a sharp mind and a dull pencil.\n\nHe checked each line and put the item in the bag, then checked the line a second time after the bag was zipped. The second pass caught the permission slip, still on the counter under a library book. The inhaler was in the pocket of the sweatshirt, which would have been useless if the sweatshirt had stayed on the chair.\n\nAt the tournament he did not win his room. He also did not borrow a pencil. On the ride home he added a ninth line for next time: extra lead. A list is not a wish. It is a way to see what is missing while you can still walk back to the counter.",
      [
        ["What is the passage mainly about?", "Using a written list so packing does not depend on memory.", ["How to win a math tournament.", "Why library books belong in bags.", "A speech Cruz's mother gave."], "The story contrasts the October miss with the list that caught the slip and the inhaler."],
        ["What had gone wrong in October?", "Cruz arrived with a dull pencil.", ["He forgot the tournament date.", "The fridge was empty.", "He lost his sweatshirt on the bus."], "Memory failed when he arrived with a sharp mind and a dull pencil."],
        ["What did the second pass find?", "The permission slip under a library book.", ["An extra calculator.", "The winning trophy.", "A broken zipper."], "The slip was still on the counter under a library book."],
        ["Where was the inhaler?", "In the sweatshirt pocket.", ["In the refrigerator.", "At the tournament desk.", "Inside the library book."], "The passage says the inhaler was in the pocket of the sweatshirt."],
        ["Why does Cruz add extra lead to the list?", "He wants the next packing to include a spare.", ["Lead is the prize for second place.", "The list can hold only nine words.", "His pencil was taken by a judge."], "He adds the line for next time after not needing to borrow a pencil, improving the list."],
        ["The last sentence means a list", "shows a missing item in time to fix it.", ["replaces studying.", "is only a wish.", "should be memorized and thrown away."], "It says a list lets you see what is missing while you can still walk back to the counter."]
      ])
  ];

  var passageOut = [];
  var questions = [];
  passages.forEach(function (p) {
    passageOut.push({ id: p.id, title: p.title, text: p.text });
    p.rows.forEach(function (row, i) {
      var n = String(i + 1).padStart ? String(i + 1) : String(i + 1);
      if (i + 1 < 10) n = "0" + (i + 1);
      else n = String(i + 1);
      var correct = row[1];
      var wrongs = row[2];
      var choices = shuffle([correct].concat(wrongs), hashId(p.id + ":" + n));
      questions.push({
        id: "r-" + p.id + "-" + n,
        section: "reading",
        type: "passage",
        stem: row[0],
        choices: choices,
        answer: choices.indexOf(correct),
        explanation: row[3],
        passageId: p.id,
        word: null,
        mock: 0,
        meta: { kind: "passage", correct: correct }
      });
    });
  });

  function hashId(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  return { passages: passageOut, questions: questions };
});
