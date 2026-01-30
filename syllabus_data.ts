
import { ClassLevel } from './types';

export interface SubjectSyllabus {
    subject: string;
    topics: string[];
}

export interface MonthlySyllabus {
    month: number;
    title: string; // e.g., "MONTH 1 (Day 1-30)"
    description: string; // e.g., "FOUNDATION START"
    subjects: SubjectSyllabus[];
}

export const DEFAULT_SYLLABUS: Record<string, MonthlySyllabus[]> = {
    '9': [
        {
            month: 1,
            title: "MONTH 1 (Day 1-30)",
            description: "FOUNDATION START",
            subjects: [
                { subject: "Maths", topics: ["Number Systems", "Polynomials (start)"] },
                { subject: "Science", topics: ["Physics: Motion (full)", "Chemistry: Matter in Our Surroundings", "Biology: Cell – Structure & Function"] },
                { subject: "Social Science", topics: ["History: French Revolution", "Geography: India – Size & Location", "Civics: What is Democracy", "Economics: Village Palampur"] }
            ]
        },
        {
            month: 2,
            title: "MONTH 2 (Day 31-60)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Polynomials (complete)", "Linear Equations in Two Variables (start)"] },
                { subject: "Science", topics: ["Physics: Force & Laws of Motion", "Chemistry: Is Matter Around Us Pure", "Biology: Tissues"] },
                { subject: "Social Science", topics: ["History: Socialism in Europe", "Geography: Physical Features of India", "Civics: Constitutional Design", "Economics: People as Resource"] }
            ]
        },
        {
            month: 3,
            title: "MONTH 3 (Day 61-90)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Linear Equations (complete)", "Coordinate Geometry"] },
                { subject: "Science", topics: ["Physics: Gravitation", "Chemistry: Atoms & Molecules", "Biology: Diversity in Living Organisms"] },
                { subject: "Social Science", topics: ["History: Nazism in Germany", "Geography: Drainage", "Civics: Electoral Politics", "Economics: Poverty as a Challenge"] }
            ]
        },
        {
            month: 4,
            title: "MONTH 4 (Day 91-120)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Lines & Angles", "Triangles (start)"] },
                { subject: "Science", topics: ["Physics: Work & Energy", "Chemistry: Structure of Atom", "Biology: Why Do We Fall Ill"] },
                { subject: "Social Science", topics: ["History: Forest Society", "Geography: Climate", "Civics: Working of Institutions", "Economics: Food Security"] }
            ]
        },
        {
            month: 5,
            title: "MONTH 5 (Day 121-150)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Triangles (complete)", "Quadrilaterals"] },
                { subject: "Science", topics: ["Physics: Sound", "Chemistry: Chemical Reactions & Equations", "Biology: Natural Resources"] },
                { subject: "Social Science", topics: ["History: Pastoralists in the Modern World", "Geography: Natural Vegetation & Wildlife", "Civics: Democratic Rights", "(Economics revision)"] }
            ]
        },
        {
            month: 6,
            title: "MONTH 6 (Day 151-180)",
            description: "FIRST FULL REVISION",
            subjects: [
                { subject: "Maths", topics: ["Circles", "Heron’s Formula"] },
                { subject: "Science", topics: ["Physics revision (Motion → Sound)", "Chemistry revision (All chapters)", "Biology revision (Cell → Natural Resources)"] },
                { subject: "Social Science", topics: ["Geography: Population", "Full SST revision (History + Civics + Eco)"] }
            ]
        },
        {
            month: 7,
            title: "MONTH 7 (Day 181-210)",
            description: "SECOND ROUND START",
            subjects: [
                { subject: "Maths", topics: ["Surface Areas & Volumes", "Statistics"] },
                { subject: "Science", topics: ["Numericals heavy practice", "Diagrams + definitions"] },
                { subject: "Social Science", topics: ["History + Geography answer writing", "Maps practice"] }
            ]
        },
        {
            month: 8,
            title: "MONTH 8 (Day 211-240)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Probability", "Full Maths revision (Round 1)"] },
                { subject: "Science", topics: ["Physics numericals", "Chemistry reactions", "Biology diagrams"] },
                { subject: "Social Science", topics: ["Civics + Economics full revision"] }
            ]
        },
        {
            month: 9,
            title: "MONTH 9 (Day 241-270)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Sample papers", "Weak chapter fixing"] },
                { subject: "Science", topics: ["Case-based questions", "Assertion–Reason"] },
                { subject: "Social Science", topics: ["3 & 5 mark answers practice", "Maps daily"] }
            ]
        },
        {
            month: 10,
            title: "MONTH 10 (Day 271-300)",
            description: "ALL SUBJECTS",
            subjects: [
                { subject: "ALL", topics: ["Full syllabus revision (Round 2)", "One subject test every 7 days"] }
            ]
        },
        {
            month: 11,
            title: "MONTH 11 (Day 301-330)",
            description: "EXAM MODE",
            subjects: [
                { subject: "ALL", topics: ["Sample papers", "Mock tests", "Time management", "Presentation"] }
            ]
        },
        {
            month: 12,
            title: "MONTH 12 (Day 331-365)",
            description: "FINAL POLISH",
            subjects: [
                { subject: "ALL", topics: ["Formula revision", "Important questions", "Diagrams & maps", "Light study + confidence"] }
            ]
        }
    ],
    '10': [
        {
            month: 1,
            title: "MONTH 1 (Day 1-30)",
            description: "BOARD FOUNDATION",
            subjects: [
                { subject: "Maths", topics: ["Real Numbers", "Polynomials"] },
                { subject: "Science", topics: ["Physics: Light – Reflection & Refraction (Part 1)", "Chemistry: Chemical Reactions & Equations", "Biology: Life Processes (Nutrition)"] },
                { subject: "Social Science", topics: ["History: Rise of Nationalism in Europe", "Civics: Power Sharing", "Geography: Resources & Development", "Economics: Development"] }
            ]
        },
        {
            month: 2,
            title: "MONTH 2 (Day 31-60)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Pair of Linear Equations in Two Variables"] },
                { subject: "Science", topics: ["Physics: Light – Reflection & Refraction (Part 2)", "Chemistry: Acids, Bases & Salts", "Biology: Life Processes (Respiration, Circulation, Excretion)"] },
                { subject: "Social Science", topics: ["History: Nationalism in India", "Civics: Federalism", "Geography: Agriculture", "Economics: Sectors of Indian Economy"] }
            ]
        },
        {
            month: 3,
            title: "MONTH 3 (Day 61-90)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Quadratic Equations"] },
                { subject: "Science", topics: ["Physics: Human Eye & the Colourful World", "Chemistry: Metals & Non-metals", "Biology: Control & Coordination"] },
                { subject: "Social Science", topics: ["History: Making of Global World", "Civics: Gender, Religion & Caste", "Geography: Water Resources", "Economics: Money & Credit"] }
            ]
        },
        {
            month: 4,
            title: "MONTH 4 (Day 91-120)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Arithmetic Progressions"] },
                { subject: "Science", topics: ["Physics: Electricity", "Chemistry: Carbon & its Compounds (Part 1)", "Biology: How do Organisms Reproduce"] },
                { subject: "Social Science", topics: ["History: Age of Industrialisation", "Civics: Political Parties", "Geography: Minerals & Energy Resources", "Economics: Globalisation & Indian Economy"] }
            ]
        },
        {
            month: 5,
            title: "MONTH 5 (Day 121-150)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Triangles", "Coordinate Geometry"] },
                { subject: "Science", topics: ["Physics: Magnetism & Electromagnetic Induction", "Chemistry: Carbon & its Compounds (Part 2)", "Biology: Heredity & Evolution"] },
                { subject: "Social Science", topics: ["History: Print Culture & the Modern World", "Geography: Manufacturing Industries", "Civics revision"] }
            ]
        },
        {
            month: 6,
            title: "MONTH 6 (Day 151-180)",
            description: "FIRST FULL REVISION",
            subjects: [
                { subject: "Maths", topics: ["Trigonometry (Introduction + Identities)"] },
                { subject: "Science", topics: ["Physics revision (Light → Magnetism)", "Chemistry revision (All completed chapters)", "Biology revision (Life Processes → Heredity)"] },
                { subject: "Social Science", topics: ["Geography: Lifelines of National Economy", "Full SST revision (History + Civics + Eco)"] }
            ]
        },
        {
            month: 7,
            title: "MONTH 7 (Day 181-210)",
            description: "SECOND ROUND START",
            subjects: [
                { subject: "Maths", topics: ["Trigonometry (Heights & Distances)", "Circles"] },
                { subject: "Science", topics: ["Numericals + derivations", "Diagrams practice"] },
                { subject: "Social Science", topics: ["History + Geography answer writing", "Maps practice (daily)"] }
            ]
        },
        {
            month: 8,
            title: "MONTH 8 (Day 211-240)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Constructions", "Areas Related to Circles"] },
                { subject: "Science", topics: ["Case-study & assertion-reason questions"] },
                { subject: "Social Science", topics: ["Civics + Economics full revision", "3-mark & 5-mark answers"] }
            ]
        },
        {
            month: 9,
            title: "MONTH 9 (Day 241-270)",
            description: "",
            subjects: [
                { subject: "Maths", topics: ["Surface Areas & Volumes", "Statistics", "Probability"] },
                { subject: "Science", topics: ["PYQ based numericals", "Chemistry reactions drill"] },
                { subject: "Social Science", topics: ["Full SST PYQ practice", "Maps + timelines"] }
            ]
        },
        {
            month: 10,
            title: "MONTH 10 (Day 271-300)",
            description: "ALL SUBJECTS",
            subjects: [
                { subject: "ALL", topics: ["Full syllabus revision (Round 2)", "One subject test every 7 days", "Writing speed focus"] }
            ]
        },
        {
            month: 11,
            title: "MONTH 11 (Day 301-330)",
            description: "PRE-BOARD MODE",
            subjects: [
                { subject: "ALL", topics: ["Full length sample papers", "Time-bound tests", "Presentation & handwriting", "Mistake notebook daily"] }
            ]
        },
        {
            month: 12,
            title: "MONTH 12 (Day 331-365)",
            description: "FINAL BOARD MODE",
            subjects: [
                { subject: "ALL", topics: ["Formula sheets", "Important questions", "Diagrams & maps only", "Light study + confidence"] }
            ]
        }
    ],
    '11': [
        {
            month: 1,
            title: "MONTH 1 (Day 1-30)",
            description: "FOUNDATION START",
            subjects: [
                { subject: "Physics", topics: ["Physical World & Measurement", "Units & Measurements"] },
                { subject: "Chemistry", topics: ["Some Basic Concepts of Chemistry", "Structure of Atom (start)"] },
                { subject: "Maths", topics: ["Sets", "Relations & Functions"] }
            ]
        },
        {
            month: 2,
            title: "MONTH 2 (Day 31-60)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Motion in a Straight Line"] },
                { subject: "Chemistry", topics: ["Structure of Atom (complete)"] },
                { subject: "Maths", topics: ["Trigonometric Functions"] }
            ]
        },
        {
            month: 3,
            title: "MONTH 3 (Day 61-90)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Motion in a Plane"] },
                { subject: "Chemistry", topics: ["Classification of Elements & Periodicity"] },
                { subject: "Maths", topics: ["Trigonometric Equations"] }
            ]
        },
        {
            month: 4,
            title: "MONTH 4 (Day 91-120)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Laws of Motion"] },
                { subject: "Chemistry", topics: ["Chemical Bonding & Molecular Structure"] },
                { subject: "Maths", topics: ["Complex Numbers & Quadratic Equations"] }
            ]
        },
        {
            month: 5,
            title: "MONTH 5 (Day 121-150)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Work, Energy & Power"] },
                { subject: "Chemistry", topics: ["States of Matter (Gases & Liquids)"] },
                { subject: "Maths", topics: ["Linear Inequalities", "Permutations & Combinations"] }
            ]
        },
        {
            month: 6,
            title: "MONTH 6 (Day 151-180)",
            description: "FIRST REVISION + DEPTH",
            subjects: [
                { subject: "Physics", topics: ["Centre of Mass & Rotational Motion"] },
                { subject: "Chemistry", topics: ["Thermodynamics"] },
                { subject: "Maths", topics: ["Binomial Theorem", "Sequence & Series"] }
            ]
        },
        {
            month: 7,
            title: "MONTH 7 (Day 181-210)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Gravitation"] },
                { subject: "Chemistry", topics: ["Equilibrium"] },
                { subject: "Maths", topics: ["Straight Lines"] }
            ]
        },
        {
            month: 8,
            title: "MONTH 8 (Day 211-240)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Mechanical Properties of Solids"] },
                { subject: "Chemistry", topics: ["Redox Reactions"] },
                { subject: "Maths", topics: ["Conic Sections (Circle, Parabola)"] }
            ]
        },
        {
            month: 9,
            title: "MONTH 9 (Day 241-270)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Mechanical Properties of Fluids"] },
                { subject: "Chemistry", topics: ["Hydrogen"] },
                { subject: "Maths", topics: ["Introduction to 3D Geometry"] }
            ]
        },
        {
            month: 10,
            title: "MONTH 10 (Day 271-300)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Thermal Properties of Matter"] },
                { subject: "Chemistry", topics: ["s-Block Elements"] },
                { subject: "Maths", topics: ["Limits & Derivatives"] }
            ]
        },
        {
            month: 11,
            title: "MONTH 11 (Day 301-330)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Thermodynamics"] },
                { subject: "Chemistry", topics: ["Some Basic Organic Chemistry", "Hydrocarbons (start)"] },
                { subject: "Maths", topics: ["Mathematical Reasoning", "Statistics"] }
            ]
        },
        {
            month: 12,
            title: "MONTH 12 (Day 331-365)",
            description: "FINAL CHAPTERS + FULL REVISION",
            subjects: [
                { subject: "Physics", topics: ["Oscillations & Waves"] },
                { subject: "Chemistry", topics: ["Hydrocarbons (complete)", "Environmental Chemistry"] },
                { subject: "Maths", topics: ["Probability", "Full Maths revision"] }
            ]
        }
    ],
    '12': [
        {
            month: 1,
            title: "MONTH 1 (Day 1-30)",
            description: "ELECTRIC START",
            subjects: [
                { subject: "Physics", topics: ["Electrostatics (Electric Charges & Fields)", "Electrostatic Potential & Capacitance"] },
                { subject: "Chemistry", topics: ["Solid State", "Solutions"] },
                { subject: "Maths", topics: ["Relations & Functions", "Inverse Trigonometric Functions"] }
            ]
        },
        {
            month: 2,
            title: "MONTH 2 (Day 31-60)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Current Electricity"] },
                { subject: "Chemistry", topics: ["Electrochemistry"] },
                { subject: "Maths", topics: ["Matrices", "Determinants"] }
            ]
        },
        {
            month: 3,
            title: "MONTH 3 (Day 61-90)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Moving Charges & Magnetism"] },
                { subject: "Chemistry", topics: ["Chemical Kinetics", "Surface Chemistry"] },
                { subject: "Maths", topics: ["Continuity & Differentiability"] }
            ]
        },
        {
            month: 4,
            title: "MONTH 4 (Day 91-120)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Magnetism & Matter", "Electromagnetic Induction"] },
                { subject: "Chemistry", topics: ["General Principles & Processes of Isolation of Elements (Metallurgy)"] },
                { subject: "Maths", topics: ["Applications of Derivatives"] }
            ]
        },
        {
            month: 5,
            title: "MONTH 5 (Day 121-150)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Alternating Current"] },
                { subject: "Chemistry", topics: ["p-Block Elements (Part 1)"] },
                { subject: "Maths", topics: ["Integrals"] }
            ]
        },
        {
            month: 6,
            title: "MONTH 6 (Day 151-180)",
            description: "FIRST REVISION + DEPTH",
            subjects: [
                { subject: "Physics", topics: ["Electromagnetic Waves", "Ray Optics & Optical Instruments"] },
                { subject: "Chemistry", topics: ["p-Block Elements (Part 2)"] },
                { subject: "Maths", topics: ["Applications of Integrals", "Differential Equations"] }
            ]
        },
        {
            month: 7,
            title: "MONTH 7 (Day 181-210)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Wave Optics"] },
                { subject: "Chemistry", topics: ["d- and f-Block Elements"] },
                { subject: "Maths", topics: ["Vectors"] }
            ]
        },
        {
            month: 8,
            title: "MONTH 8 (Day 211-240)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Dual Nature of Radiation & Matter"] },
                { subject: "Chemistry", topics: ["Coordination Compounds"] },
                { subject: "Maths", topics: ["Three-Dimensional Geometry"] }
            ]
        },
        {
            month: 9,
            title: "MONTH 9 (Day 241-270)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Atoms", "Nuclei"] },
                { subject: "Chemistry", topics: ["Haloalkanes & Haloarenes"] },
                { subject: "Maths", topics: ["Linear Programming"] }
            ]
        },
        {
            month: 10,
            title: "MONTH 10 (Day 271-300)",
            description: "",
            subjects: [
                { subject: "Physics", topics: ["Semiconductor Electronics", "Communication Systems"] },
                { subject: "Chemistry", topics: ["Alcohols, Phenols & Ethers"] },
                { subject: "Maths", topics: ["Probability"] }
            ]
        },
        {
            month: 11,
            title: "MONTH 11 (Day 301-330)",
            description: "ORGANIC + REVISION",
            subjects: [
                { subject: "Physics", topics: ["Full Physics revision (Electrostatics → Electronics)"] },
                { subject: "Chemistry", topics: ["Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules"] },
                { subject: "Maths", topics: ["Full Maths revision"] }
            ]
        },
        {
            month: 12,
            title: "MONTH 12 (Day 331-365)",
            description: "FINAL BOARD MODE",
            subjects: [
                { subject: "ALL", topics: ["NCERT line-by-line revision", "Important derivations", "Formula sheets", "Sample papers", "Mock tests"] }
            ]
        }
    ]
};
