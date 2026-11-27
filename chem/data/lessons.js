(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CHEM_LESSONS = api;
})(typeof window !== "undefined" ? window : null, function () {
  var lessons = [
    {
      id: "matter",
      topic: "matter",
      title: "Matter and measurement",
      minutes: 12,
      paragraphs: [
        "Matter is anything with mass that takes up space. An element is one kind of atom. A compound is two or more elements bonded in a fixed ratio. A mixture can be separated by physical means. Salt water is a homogeneous mixture. Sand in water is heterogeneous.",
        "A physical change, such as melting, keeps the same substance. A chemical change, such as rusting, makes a new substance. Mass is conserved in a closed change.",
        "Significant figures show how precise a measurement is. Nonzero digits count. Zeros between nonzero digits count. Leading zeros do not count. In this course, trailing zeros count only when a decimal point is written, so 1500 has 2 significant figures and 1.50 × 10^3 has 3. For multiplication and division, the result keeps as many significant figures as the less precise measurement. For addition and subtraction, round to the least precise decimal place. Defined conversion factors, such as 1000 m = 1 km, are exact and do not limit the significant figures.",
        "Density is mass divided by volume. Convert units by multiplying by a fraction equal to 1, such as 1000 m / 1 km, so the unwanted unit cancels."
      ],
      example: {
        stem: "How many significant figures are in 0.00450?",
        choices: ["2", "3", "5", "6"],
        answer: 1,
        explanation: "The leading zeros only locate the decimal point. The digits 4, 5, and the final 0 are significant, so the count is 3."
      },
      tips: [
        "Write the unit through every conversion step.",
        "If a whole-number answer needs trailing zeros to be significant, use scientific notation.",
        "Kelvin is not used in this lesson, but Celsius and Kelvin differ by 273 in the gas lessons."
      ]
    },
    {
      id: "atomic",
      topic: "atomic",
      title: "Atomic structure",
      minutes: 12,
      paragraphs: [
        "The nucleus holds protons and neutrons. Electrons occupy the space around it. A proton has charge +1, an electron has charge −1, and a neutron has no charge. Nearly all of the mass is in the nucleus.",
        "The atomic number is the number of protons. That number decides which element the atom is. The mass number is protons plus neutrons. Isotopes of an element have the same atomic number and different mass numbers. In a neutral atom the electron count equals the proton count. A positive ion has lost electrons. A negative ion has gained electrons.",
        "The average atomic mass on the periodic table is a weighted average of the naturally occurring isotopes. It is not the same thing as the mass number of one atom.",
        "Electrons are arranged in energy levels and sublevels. An orbital holds at most two electrons. An s sublevel holds 2, a p sublevel holds 6, and a d sublevel holds 10. For the main-group elements in this course, fill 4s before 3d. Sodium is 1s2 2s2 2p6 3s1 and has one valence electron."
      ],
      example: {
        stem: "An atom of carbon-14 has how many neutrons?",
        choices: ["6", "8", "14", "20"],
        answer: 1,
        explanation: "Carbon's atomic number is 6, so every carbon atom has 6 protons. Neutrons = 14 − 6 = 8."
      },
      tips: [
        "Changing the proton count changes the element. Changing the neutron count makes an isotope.",
        "A charge of 2+ means two electrons were lost, not two protons.",
        "Valence electrons are the ones in the highest occupied energy level for the main groups."
      ]
    },
    {
      id: "periodic",
      topic: "periodic",
      title: "Periodic table and trends",
      minutes: 12,
      paragraphs: [
        "A period is a horizontal row. A group is a vertical column. Elements in the same main group have the same number of valence electrons, so they react in similar ways. Group 1 is the alkali metals, group 2 the alkaline earth metals, group 17 the halogens, and group 18 the noble gases.",
        "Metals are on the left, nonmetals on the right, and metalloids sit along the staircase. Noble gases are mostly unreactive. Alkali metals are the most reactive metals in a typical first course.",
        "Going down a group, atoms get larger because they add an energy level. Going across a period, atoms get smaller because the nucleus pulls the same energy level more tightly. Ionization energy and electronegativity generally increase across a period and decrease down a group. Fluorine is the most electronegative element.",
        "A positive ion is smaller than its neutral atom. A negative ion is larger than its neutral atom."
      ],
      example: {
        stem: "Which atom is larger, sodium or chlorine?",
        choices: ["Sodium", "Chlorine", "They are the same size", "It cannot be compared"],
        answer: 0,
        explanation: "Sodium and chlorine are in the same period. Atomic radius decreases from left to right, so sodium is larger."
      },
      tips: [
        "Compare elements in the same group or the same period before you invent a diagonal rule.",
        "A higher period number means a larger occupied energy level for main-group atoms.",
        "The reference table in this app colors categories. The color is a learning aid, not a measured property."
      ]
    },
    {
      id: "bonding",
      topic: "bonding",
      title: "Bonding",
      minutes: 12,
      paragraphs: [
        "An ionic bond forms when a metal transfers electrons to a nonmetal and the resulting ions attract. A covalent bond forms when atoms share electrons, usually two nonmetals. A metallic bond is the attraction between metal cations and a shared sea of electrons.",
        "In this course, a large electronegativity difference, such as sodium with chlorine, is treated as ionic. A bond between two of the same atom is nonpolar covalent. A bond with a moderate difference, such as H–O, is polar covalent.",
        "A molecule's shape depends on electron groups around the central atom, including lone pairs. Methane, CH4, is tetrahedral. Water is bent because oxygen has two bonding pairs and two lone pairs, so the molecule is polar even though each bond is the same kind.",
        "Ionic compounds usually have high melting points and conduct electricity only when melted or dissolved. Metals conduct as solids. Many small molecular substances have low melting points and do not conduct."
      ],
      example: {
        stem: "Which substance is held together by ionic bonds?",
        choices: ["CO2", "NaCl", "Cl2", "H2O"],
        answer: 1,
        explanation: "Sodium is a metal and chlorine is a nonmetal. They form ions, Na+ and Cl−. The other three are molecular."
      },
      tips: [
        "Look at the elements first: metal plus nonmetal usually means ionic in this course.",
        "A polar bond does not always make a polar molecule. Shape matters.",
        "Hydrogen is stable with 2 electrons. Most other main-group atoms are aiming for 8."
      ]
    },
    {
      id: "nomenclature",
      topic: "nomenclature",
      title: "Nomenclature",
      minutes: 14,
      paragraphs: [
        "Binary ionic names put the metal first and change the nonmetal ending to -ide. NaCl is sodium chloride. CaCl2 is calcium chloride. The subscript is not said out loud when the charges already fix the ratio.",
        "Iron, copper, lead, and tin need a Roman numeral for the metal's charge. Fe2O3 is iron(III) oxide because three oxide ions, each 2−, require two iron ions at 3+. Zinc and silver have fixed charges in this course, so ZnCl2 is zinc chloride and AgNO3 is silver nitrate, with no numeral.",
        "Two nonmetals use prefixes: mono-, di-, tri-, tetra-, penta-, hexa-. CO is carbon monoxide. N2O4 is dinitrogen tetroxide. Do not start the first element's name with mono-.",
        "Polyatomic ions keep their names. Na2SO4 is sodium sulfate and KNO2 is potassium nitrite. Binary acids are hydro- plus -ic acid, so HCl is hydrochloric acid. Oxyacids of sulfate and nitrate are sulfuric acid and nitric acid. One fewer oxygen gives the -ous acid: H2SO3 is sulfurous acid."
      ],
      example: {
        stem: "What is the name of FeCl2?",
        choices: ["iron chloride", "iron(II) chloride", "iron(III) chloride", "chlorine ferride"],
        answer: 1,
        explanation: "Two chloride ions are 2− altogether, so the iron ion is 2+. The Stock name is iron(II) chloride."
      },
      tips: [
        "Find the charge of the anion first, then solve for the metal's charge.",
        "Sulfate is SO4 2−. Sulfite is SO3 2−. Nitrate is NO3 −. Nitrite is NO2 −.",
        "Check that the formula is electrically neutral before you name it."
      ]
    },
    {
      id: "mole",
      topic: "mole",
      title: "The mole and stoichiometry",
      minutes: 14,
      paragraphs: [
        "A mole is 6.022 × 10^23 particles. The molar mass of a substance, in grams per mole, is the sum of the atomic masses in the formula. In problems that do not give other values, use the hundredths values from the lesson on measurement practice: H 1.01, C 12.01, N 14.01, O 16.00, and the matching values for the other elements listed in the question.",
        "Grams and moles convert through the molar mass. Particles and moles convert through Avogadro's number. At STP, which this course takes as 0°C and 1 atm, one mole of an ideal gas occupies 22.4 L.",
        "A balanced equation gives mole ratios. To go from the mass of one substance to the mass of another, convert mass to moles, multiply by the mole ratio, then convert moles to mass. The limiting reactant is the one that makes less product. Percent yield is actual yield divided by theoretical yield, times 100.",
        "An empirical formula is the simplest whole-number ratio. A molecular formula is a whole-number multiple of the empirical formula."
      ],
      example: {
        stem: "How many moles of O2 react with 4.0 mol H2 in 2 H2 + O2 → 2 H2O?",
        choices: ["1.0 mol", "2.0 mol", "4.0 mol", "8.0 mol"],
        answer: 1,
        explanation: "The ratio of O2 to H2 is 1:2. 4.0 mol H2 × (1 mol O2 / 2 mol H2) = 2.0 mol O2."
      },
      tips: [
        "Write the unit you want on top of the conversion factor.",
        "Coefficients are the mole ratio. Subscripts are part of the formula.",
        "If the problem says to round to the hundredths place, do that after the last multiplication."
      ]
    },
    {
      id: "reactions",
      topic: "reactions",
      title: "Reactions and balancing",
      minutes: 12,
      paragraphs: [
        "A balanced equation has the same number of each kind of atom on both sides. You may change coefficients. You may not change subscripts, because that would change the substances.",
        "Synthesis joins reactants into one product. Decomposition breaks one reactant apart. Single replacement is A + BC → AC + B, and it happens only when A is more reactive than B. Double replacement is AB + CD → AD + CB, often with a precipitate. Combustion of a hydrocarbon in oxygen makes carbon dioxide and water.",
        "For activity in this course, use this order from more reactive to less reactive: K, Ca, Na, Mg, Al, Zn, Fe, H, Cu, Ag. A metal replaces the ion of a metal below it. Copper metal does not replace zinc ion.",
        "A short solubility guide: nitrate salts dissolve, alkali-metal salts dissolve, and ammonium salts dissolve. Silver chloride and barium sulfate do not. (s) means solid, (l) liquid, (g) gas, and (aq) dissolved in water."
      ],
      example: {
        stem: "Which set of coefficients balances Al + O2 → Al2O3?",
        choices: ["1, 1, 1", "2, 3, 1", "4, 3, 2", "2, 1, 2"],
        answer: 2,
        explanation: "Four Al atoms and six O atoms on each side: 4 Al + 3 O2 → 2 Al2O3."
      },
      tips: [
        "Count atoms of one element at a time. Leave H and O for last in combustion.",
        "Diatomic elements in this course are H2, N2, O2, F2, Cl2, Br2, and I2.",
        "If every coefficient is divisible by the same number, divide through so the set is simplest."
      ]
    },
    {
      id: "gases",
      topic: "gases",
      title: "Gases",
      minutes: 12,
      paragraphs: [
        "In the kinetic-molecular model, gas particles are far apart, move randomly, and collide with the container walls. Those collisions are the pressure. Temperature is a measure of the average kinetic energy. This course uses the ideal-gas picture unless a question says otherwise.",
        "Boyle's law: at constant temperature, P1 V1 = P2 V2. Pressure and volume move in opposite directions. Charles's law: at constant pressure, V1 / T1 = V2 / T2. Volume and temperature move together, and the temperature must be in kelvin. Combined gas law: P1 V1 / T1 = P2 V2 / T2.",
        "The ideal gas law is PV = nRT. When pressure is in atmospheres and volume is in liters, use R = 0.0821 L·atm/(mol·K). Convert Celsius with T(K) = t(°C) + 273. This course uses 273, not 273.15.",
        "Standard temperature and pressure here means 0°C and 1 atm. One mole of ideal gas then has a volume of 22.4 L. Real gases depart from these laws when the pressure is very high or the temperature is very low."
      ],
      example: {
        stem: "A gas has a volume of 3.0 L at 300 K. The pressure stays the same and the temperature becomes 600 K. What is the new volume?",
        choices: ["1.5 L", "3.0 L", "6.0 L", "9.0 L"],
        answer: 2,
        explanation: "Charles's law: V2 = 3.0 L × (600 K / 300 K) = 6.0 L. Doubling the kelvin temperature doubles the volume."
      },
      tips: [
        "Never plug Celsius into a gas law. Add 273 first.",
        "If pressure goes up and temperature stays put, volume goes down.",
        "Check that the R you use matches the pressure unit in the problem."
      ]
    },
    {
      id: "solutions",
      topic: "solutions",
      title: "Solutions",
      minutes: 12,
      paragraphs: [
        "A solution is a homogeneous mixture. The solute is the substance that dissolves. The solvent does the dissolving. In an aqueous solution the solvent is water. Like dissolves like: polar solvents dissolve many ionic compounds and polar molecules.",
        "Molarity is moles of solute divided by liters of solution. If the volume is given in milliliters, convert to liters before you divide. To prepare a solution, dissolve the solute and then add solvent until the solution reaches the mark. Do not add the full volume of solvent and then the solute.",
        "Dilution does not change the moles of solute: M1 V1 = M2 V2. The units of volume must match on both sides. Adding water lowers the molarity and raises the volume.",
        "A saturated solution holds as much solute as it can at that temperature. Unsaturated means more could dissolve. For most solids in water, solubility rises as the water gets hotter. For gases in water, solubility falls as the water gets hotter."
      ],
      example: {
        stem: "What volume of 2.0 M HCl is needed to prepare 500 mL of 0.40 M HCl?",
        choices: ["40 mL", "100 mL", "250 mL", "500 mL"],
        answer: 1,
        explanation: "M1 V1 = M2 V2. V1 = (0.40 M × 500 mL) / 2.0 M = 100 mL."
      },
      tips: [
        "Moles = molarity × liters.",
        "Label stock and diluted solutions before you write M1 V1 = M2 V2.",
        "A concentrated solution is not automatically a strong electrolyte. Concentration and strength are different ideas."
      ]
    },
    {
      id: "acids",
      topic: "acids",
      title: "Acids and bases",
      minutes: 12,
      paragraphs: [
        "In the Arrhenius picture, an acid produces H+ in water and a base produces OH−. A Brønsted–Lowry acid donates a proton and a base accepts a proton. You should not taste or touch lab acids and bases. Descriptions such as sour or slippery are background, not a test you perform.",
        "pH = −log[H+]. pOH = −log[OH−]. At 25°C in this course, pH + pOH = 14.00 and [H+][OH−] = 1.0 × 10^−14. A pH below 7 is acidic, 7 is neutral, and above 7 is basic. A change of 1 pH unit means a factor of 10 in [H+].",
        "A strong acid or strong base ionizes completely. HCl, HBr, HI, HNO3, H2SO4, and HClO4 are the strong acids used here. NaOH and KOH are strong bases. Acetic acid is weak. For the practice problems, concentrations are large enough that water's own ions can be ignored, and each strong acid is treated as giving one H+ per formula unit.",
        "Neutralization of a strong acid with a strong hydroxide base makes a salt and water. HCl + NaOH → NaCl + H2O. Strong and concentrated do not mean the same thing. A 0.001 M HCl solution is strong and dilute."
      ],
      example: {
        stem: "What is the pH of 1.0 × 10^−3 M HCl?",
        choices: ["3.00", "11.00", "1.00", "7.00"],
        answer: 0,
        explanation: "HCl is strong, so [H+] = 1.0 × 10^−3 M. pH = 3.00. The pOH would be 11.00, which is the usual trap."
      },
      tips: [
        "If the question gives [OH−], find pOH first, then subtract from 14.",
        "A lower pH means a higher [H+].",
        "Write 3.00, not just 3, when the concentration is given as 1.0 × 10 to a power."
      ]
    },
    {
      id: "thermo",
      topic: "thermo",
      title: "Thermochemistry",
      minutes: 12,
      paragraphs: [
        "Heat is energy transferred because of a temperature difference. Temperature is not the same quantity as heat. The joule is the energy unit in these problems. The system is the part you are watching. Everything else is the surroundings.",
        "An exothermic process releases heat to the surroundings. In this course its enthalpy change, ΔH, is negative. An endothermic process absorbs heat and has a positive ΔH. Melting and boiling are endothermic. Freezing and condensation are exothermic. During a phase change the temperature stays constant while the heat goes into breaking or forming attractions.",
        "For a temperature change without a phase change, q = mcΔT. Use the specific heat given in the problem. For liquid water, use 4.18 J/g°C when the problem does not give another value. ΔT is the final temperature minus the initial temperature.",
        "The law of conservation of energy says energy lost by one part is gained by another, aside from work the problem tells you to ignore. Hess's law, the idea that the total enthalpy change does not depend on the path, is an honors extension in this course."
      ],
      example: {
        stem: "How much heat raises 10.0 g of water by 5.00°C? Use c = 4.18 J/g°C.",
        choices: ["20.9 J", "41.8 J", "209 J", "418 J"],
        answer: 2,
        explanation: "q = mcΔT = 10.0 × 4.18 × 5.00 = 209 J."
      },
      tips: [
        "Check whether the question asks for the system or the surroundings before you choose a sign.",
        "A high specific heat means a bigger mass of energy is needed for the same temperature change.",
        "On a heating curve, a flat segment is a phase change, not a failure of the thermometer."
      ]
    },
    {
      id: "kinetics",
      topic: "kinetics",
      title: "Kinetics and equilibrium",
      minutes: 12,
      honors: true,
      paragraphs: [
        "The rate of a reaction is how fast reactants become products. In this course, raising the temperature, raising the concentration of a reactant in solution, or breaking a solid into smaller pieces usually increases the rate. A catalyst speeds the reaction and is not used up. It lowers the activation energy. It does not change the final equilibrium amounts.",
        "Collision theory says particles must collide with enough energy and with a useful orientation. The activation energy is the minimum energy needed for a successful collision.",
        "Equilibrium is a dynamic state: the forward and reverse rates are equal, and the amounts stay constant. They do not have to be equal to each other. A reversible reaction is written with a double arrow. Equilibrium is usually discussed for a closed system.",
        "Le Chatelier's idea is an honors tool here. Adding a reactant shifts the reaction toward products. Removing a product also shifts toward products. For an exothermic reaction, heating shifts toward reactants because heat is treated as a product. Raising the pressure favors the side with fewer moles of gas. A catalyst does not shift the position."
      ],
      example: {
        stem: "Which change increases the rate of most reactions but does not shift equilibrium?",
        choices: ["Adding a catalyst", "Heating an exothermic reaction", "Removing a product", "Raising the pressure on a gas equilibrium"],
        answer: 0,
        explanation: "A catalyst lowers the activation energy for both directions, so equilibrium is reached sooner and the position stays the same."
      },
      tips: [
        "Rate and yield are different questions. Fast does not mean complete.",
        "At equilibrium the amounts are constant, not necessarily equal.",
        "When a pressure question appears, count moles of gas only."
      ]
    }
  ];
  var face = {
    matter: {
      eq: "density = mass / volume",
      remember: "Trailing zeros count only when a decimal point is written. 1.50 × 10<sup>3</sup> has 3 significant figures.",
      steps: ["Write the measured number and mark the significant digits.", "For 0.00450, ignore the leading zeros.", "Count 4, 5, and the last 0. That is 3."]
    },
    atomic: {
      eq: "mass number = protons + neutrons",
      remember: "The atomic number is the proton count. Change that, and you have a different element.",
      steps: ["Carbon’s atomic number is 6, so carbon-14 has 6 protons.", "Subtract from the mass number: 14 − 6.", "The atom has 8 neutrons."]
    },
    periodic: {
      eq: "same period: radius decreases left → right",
      remember: "Down a group, atoms get larger. Across a period, they get smaller.",
      steps: ["Sodium and chlorine are both in period 3.", "Atomic radius decreases across a period.", "Sodium is the larger atom."]
    },
    bonding: {
      eq: "metal + nonmetal → ionic",
      remember: "A polar bond does not always make a polar molecule. Shape matters.",
      steps: ["Na is a metal and Cl is a nonmetal.", "Electrons transfer and the ions attract.", "NaCl is ionic. CO<sub>2</sub>, Cl<sub>2</sub>, and H<sub>2</sub>O are molecular."]
    },
    nomenclature: {
      eq: "FeCl<sub>2</sub> = iron(II) chloride",
      remember: "Find the anion’s charge first, then the metal’s Roman numeral.",
      steps: ["Each chloride is 1−, and there are two of them.", "The iron ion must be 2+.", "The Stock name is iron(II) chloride."]
    },
    mole: {
      eq: "2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O",
      remember: "Convert mass to moles, use the coefficient ratio, then convert back to mass.",
      steps: ["The ratio of O<sub>2</sub> to H<sub>2</sub> is 1 to 2.", "4.0 mol H<sub>2</sub> × (1/2) = 2.0 mol O<sub>2</sub>.", "The coefficients are the mole ratio. The subscripts are not."]
    },
    reactions: {
      eq: "4 Al + 3 O<sub>2</sub> → 2 Al<sub>2</sub>O<sub>3</sub>",
      remember: "Change coefficients when you balance. Never change a subscript.",
      steps: ["Count Al: two on the right, so the left needs 4 Al to match 2 formula units.", "Count O: 3 O<sub>2</sub> gives 6 oxygen atoms, and 2 Al<sub>2</sub>O<sub>3</sub> also has 6.", "The balanced set is 4, 3, 2."]
    },
    gases: {
      eq: "V<sub>1</sub> / T<sub>1</sub> = V<sub>2</sub> / T<sub>2</sub>",
      remember: "Gas-law temperatures are in kelvin. Add 273 to a Celsius reading before you calculate.",
      steps: ["Pressure is constant, so this is Charles’s law.", "600 K is twice 300 K.", "The volume doubles, from 3.0 L to 6.0 L."]
    },
    solutions: {
      eq: "M<sub>1</sub>V<sub>1</sub> = M<sub>2</sub>V<sub>2</sub>",
      remember: "Dilution does not change the moles of solute.",
      steps: ["V<sub>1</sub> = M<sub>2</sub>V<sub>2</sub> / M<sub>1</sub>.", "(0.40 × 500) / 2.0 = 100.", "Measure 100 mL of the 2.0 M stock."]
    },
    acids: {
      eq: "pH + pOH = 14.00",
      remember: "A lower pH means a higher [H<sup>+</sup>]. Strong is not the same word as concentrated.",
      steps: ["HCl is strong, so [H<sup>+</sup>] equals 1.0 × 10<sup>−3</sup> M.", "pH = −log(1.0 × 10<sup>−3</sup>) = 3.00.", "11.00 is the pOH, which is the usual trap."]
    },
    thermo: {
      eq: "q = mcΔT",
      remember: "Temperature is not heat. During a phase change the temperature stays flat.",
      steps: ["Write q = 10.0 × 4.18 × 5.00.", "10.0 × 5.00 = 50.0, and 50.0 × 4.18 = 209.", "The water gains 209 J."]
    },
    kinetics: {
      eq: "forward rate = reverse rate",
      remember: "A catalyst speeds both directions. It does not move the equilibrium amounts.",
      steps: ["Heating, removing product, and raising pressure can shift equilibrium.", "A catalyst lowers the activation energy for both directions.", "The rate changes. The equilibrium position does not."]
    }
  };
  lessons.forEach(function (lesson) {
    var extra = face[lesson.id];
    if (!extra) return;
    lesson.eq = extra.eq;
    lesson.remember = extra.remember;
    lesson.steps = extra.steps;
  });
  return lessons;
});
