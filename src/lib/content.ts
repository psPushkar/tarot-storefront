// ---------------------------------------------------------------------------
// content.ts — Editorial content for Aurelia Sable's tarot practice
// All data is plain, self-contained, and exports only typed constants.
// ---------------------------------------------------------------------------

export interface Article {
  slug: string;
  title: string;
  dek: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readingMinutes: number;
  body: Block[];
}

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] };

export interface Faq {
  question: string;
  answer: string;
  group: string;
}

export interface ValueProp {
  title: string;
  body: string;
}

export interface Step {
  index: number;
  title: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Page intros
// ---------------------------------------------------------------------------

export const homeIntro: { eyebrow: string; heading: string; body: string } = {
  eyebrow: "Tarot with Aurelia Sable",
  heading: "The cards make the invisible plain",
  body: "Nineteen years of reading in Lisbon. Tarot, astrology and numerology for people at turning points \u2014 leaving something behind, choosing between two goods, beginning again when beginning again is supposed to be over."
};

export const servicesIntro: { eyebrow: string; heading: string; body: string } = {
  eyebrow: "Readings",
  heading: "What I offer and how it works",
  body: "Every reading begins with a question you bring and ends with a written record you keep. I read in English and Portuguese, by video or in person at my studio in Lisbon\u2019s Pr\u00edncipe Real."
};

export const reviewsIntro: { eyebrow: string; heading: string; body: string } = {
  eyebrow: "Kind words",
  heading: "What people say afterwards",
  body: "I don\u2019t curate these for drama. Most of the people I read for are quiet, private individuals who came because something was genuinely at stake. Their words speak for themselves."
};

export const journalIntro: { eyebrow: string; heading: string; body: string } = {
  eyebrow: "Journal",
  heading: "Notes on the cards and their work",
  body: "Essays on tarot, grief, decision-making and the history of the deck. Written for people who are curious about the practice but suspicious of mystification \u2014 as they should be."
};

export const contactIntro: { eyebrow: string; heading: string; body: string } = {
  eyebrow: "Get in touch",
  heading: "A reading begins with a question",
  body: "If you have a question taking shape \u2014 or one you have been carrying for a while \u2014 write to me. I will reply within two working days, usually sooner. No obligation, no sales pitch."
};

export const faqIntro: { eyebrow: string; heading: string; body: string } = {
  eyebrow: "Questions",
  heading: "Things people ask before booking",
  body: "Honest answers about what happens during a reading, what I will and will not do, and the practical details of scheduling, payment and cancellation. If your question is not here, write to me."
};

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

export const howItWorks: Step[] = [
  {
    index: 1,
    title: "Choose your reading",
    body: "Decide between a single-question reading, a full spread or a combined tarot-and-astrology session. Each option page explains the format, length and fee so you know what to expect before booking."
  },
  {
    index: 2,
    title: "Book and share your question",
    body: "Pick a date and time that suits you. The booking form asks for your question or the situation you want to explore. A few honest sentences are better than a paragraph. I read these before we meet."
  },
  {
    index: 3,
    title: "The reading itself",
    body: "We meet by video or in my Lisbon studio. I lay the cards, describe what I see, and we talk. Sessions are unhurried. You are welcome to take notes, but you will also receive a written record afterwards."
  },
  {
    index: 4,
    title: "Your written record arrives",
    body: "Within forty-eight hours you receive a written summary of the spread, the positions, my interpretation and any practical observations. It is yours to revisit whenever the situation shifts or a new question forms."
  }
];

// ---------------------------------------------------------------------------
// Value propositions
// ---------------------------------------------------------------------------

export const valueProps: ValueProp[] = [
  {
    title: "Clarity, not prophecy",
    body: "I do not predict the future. I help you see the shape of a situation you are already living in, so you can decide what to do next with your eyes open."
  },
  {
    title: "Nineteen years of practice",
    body: "I have been reading tarot since 2007. That length of time means I have sat across from most kinds of difficulty and most kinds of hope. Very little surprises me."
  },
  {
    title: "A record you keep",
    body: "Every reading produces a written summary sent within two days. Conversations fade, but a document you can return to in six months holds its value."
  }
];

// ---------------------------------------------------------------------------
// About page (long-form narrative)
// ---------------------------------------------------------------------------

export const aboutSections: Block[] = [
  {
    kind: "h2",
    text: "How I came to the cards"
  },
  {
    kind: "p",
    text: "I was twenty-six and three years into a doctorate on late-medieval devotional iconography at the University of Coimbra when I realised I was writing about images I had never truly looked at. I could date a panel painting to within a decade, name the workshop, cite the contract \u2014 but I had stopped seeing the thing itself. One afternoon in the university library I picked up a Marseille deck that someone had left on a reading-room table and turned over the cards one by one. What struck me was not mystery but specificity: each image was a small, compressed argument about a human situation. The Tower was not vague catastrophe. It was the moment after the lightning, when the structure you thought was shelter turns out to have been a prison."
  },
  {
    kind: "p",
    text: "I did not become a tarot reader that afternoon. I finished the academic year, took a leave of absence that became permanent, and spent two years studying with readers in Lisbon, Lyon and Buenos Aires whose names would mean nothing to anyone outside a very small world. I read my first paying client in 2007. I have not done anything else since."
  },
  {
    kind: "h2",
    text: "What I believe the cards do"
  },
  {
    kind: "p",
    text: "Tarot does not tell the future. I say this at the start of every reading and I say it here because it matters. The future is not a fixed object waiting in a drawer to be opened. It is the thing you are making, right now, with every small decision and avoidance and act of courage. What the cards do is externalise: they put the shape of a situation on the table where you can walk around it, see it from behind, notice the part you have been standing too close to."
  },
  {
    kind: "quote",
    text: "Most people arrive with a question they have already half-answered and have not yet let themselves hear. My work is mostly listening, then saying the thing plainly."
  },
  {
    kind: "p",
    text: "I also use astrology and numerology when they are useful, which is not always. A natal chart can give context that the cards alone do not \u2014 particularly around timing and recurring patterns. But these are tools, not oracles, and I treat them accordingly."
  },
  {
    kind: "h2",
    text: "Who I read for"
  },
  {
    kind: "p",
    text: "I read for people at turning points. That is a broad category, and it should be. Turning points include leaving a career after twenty years, choosing between two cities, sitting with grief that has no resolution, falling in love at an inconvenient age, and beginning something new when you are supposedly too old to begin. I read for architects and nurses and retired teachers and people between jobs who are not sure what the next one should be. I read in English and Portuguese."
  },
  {
    kind: "p",
    text: "I do not read for entertainment, for party tricks, or for people who want me to confirm a decision they have already made and do not intend to reconsider. I am not unkind about this, but I am direct."
  },
  {
    kind: "h2",
    text: "How I work"
  },
  {
    kind: "p",
    text: "I work from a studio in Pr\u00edncipe Real, Lisbon, and by video for clients elsewhere. In-person readings happen at a table by a window that looks out on a jacaranda tree, which is relevant only because the room matters \u2014 a good reading needs quiet, decent light and enough space to lay the cards without stacking them."
  },
  {
    kind: "p",
    text: "Every session is followed by a written record: the spread, the positions, my interpretation and anything I noticed that felt worth saying twice. I send this within forty-eight hours. Many clients tell me the written record is the most useful part. It is certainly the most durable."
  },
  {
    kind: "p",
    text: "If you have questions about working with me, the FAQ covers the practical details. If you would rather just write and see whether this feels right, I welcome that too."
  }
];

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const articles: Article[] = [
  {
    slug: "what-a-tarot-reading-can-and-cannot-do",
    title: "What a Tarot Reading Can and Cannot Do",
    dek: "An honest account of the practice, its real uses and the claims it has no business making.",
    excerpt: "Tarot does not predict the future. It does something more modest and, in my experience, more useful: it gives you a way to look at what is already happening.",
    category: "Practice",
    publishedAt: "2026-08-15",
    readingMinutes: 7,
    body: [
      {
        kind: "p",
        text: "I have been reading tarot for nineteen years, and the single most useful thing I can tell a new client is what the cards will not do. They will not predict the future. They will not name a date, identify a soulmate by initial, or tell you whether the job offer is the right one. If a reader promises you any of that, what you are paying for is theatre, not tarot."
      },
      {
        kind: "p",
        text: "This is not a disclaimer stitched on to protect me legally, though it does that too. It is the core of how I understand the work. The future is not an object sitting in a locked room. It is the thing being made, continuously, by your choices and hesitations and the choices of everyone around you. No spread of cards has access to something that does not yet exist."
      },
      {
        kind: "h2",
        text: "What the cards actually do"
      },
      {
        kind: "p",
        text: "A tarot reading externalises. It takes the interior shape of a situation \u2014 the tension, the competing desires, the thing you have not said aloud \u2014 and lays it out on a table in images you can look at from a slight distance. That distance is the useful part. Most of us are too close to our own lives to see the pattern. We mistake the foreground for the whole picture."
      },
      {
        kind: "p",
        text: "When I lay a spread for a client, I am not channelling information from elsewhere. I am reading a symbolic language, built over centuries, that is unusually good at describing human situations. The Tower is not a prophecy of disaster. It is a picture of what it feels like when a structure collapses \u2014 and it invites the question: which structure in your life is that? The Ten of Swords is not a curse. It is an image of a specific kind of exhaustion, the kind that comes at the very end of something, after which there is nothing left to endure."
      },
      {
        kind: "h2",
        text: "Where the limits are"
      },
      {
        kind: "p",
        text: "I will not diagnose illness. I will not advise you on legal matters. I will not tell you to leave your marriage or stay in it. These are the territories of doctors, lawyers and, in many cases, therapists. If a question belongs with one of those professionals, I will say so directly and without embarrassment. A tarot reader who offers medical opinions is not brave. She is dangerous."
      },
      {
        kind: "p",
        text: "I will also not guarantee outcomes. A reading can clarify the shape of a decision, surface a fear you have been avoiding, or name a pattern you have repeated three times without noticing. These are real and valuable things. But whether the clarity leads to change depends entirely on you. I cannot follow you home."
      },
      {
        kind: "h2",
        text: "What a reading is good for"
      },
      {
        kind: "p",
        text: "In my experience, readings are most useful at specific kinds of moments. When you are choosing between two options and both are genuinely good. When you are grieving and the grief has no clean resolution. When you suspect you already know what you want but have not let yourself say it. When something has ended and you are not sure what comes next."
      },
      {
        kind: "p",
        text: "These are not emergencies. They are the ordinary, difficult passages of an adult life. Tarot will not save you from them. What it can do \u2014 what it does reliably, in the right hands \u2014 is slow the question down long enough for you to hear your own answer."
      },
      {
        kind: "h2",
        text: "A final honesty"
      },
      {
        kind: "p",
        text: "Some readings are better than others. Not every spread lights up. Occasionally I sit with a client and the cards are flat, opaque, uncooperative, and what I offer is less insight than companionship \u2014 two people looking at the same images and trying to find the thread. That is still worth something, but it is not the transformative experience that tarot marketing likes to promise. I would rather you know this going in than discover it with disappointment."
      },
      {
        kind: "p",
        text: "Honesty about the limits is not modesty for its own sake. It is what makes the practice trustworthy. If I tell you the cards cannot do everything, you have reason to believe me when I tell you what they can."
      }
    ]
  },
  {
    slug: "how-to-arrive-at-a-good-question",
    title: "How to Arrive at a Good Question",
    dek: "The question you bring to a reading matters more than the cards that appear, and shaping it is a skill worth learning.",
    excerpt: "A good tarot question is specific, honest and open-ended. It does not ask for a yes or no. It asks for the shape of something you are not yet able to see clearly.",
    category: "Practice",
    publishedAt: "2026-06-02",
    readingMinutes: 7,
    body: [
      {
        kind: "p",
        text: "The most important thing you bring to a tarot reading is not an open mind or a willingness to believe. It is a question. And the quality of that question will do more to determine the quality of the reading than anything I do with the cards."
      },
      {
        kind: "p",
        text: "This is not a mystical claim. It is a practical one. A vague question produces a vague reading. A yes-or-no question produces frustration, because the cards do not deal in yes or no. A question shaped with care \u2014 specific enough to have traction, open enough to leave room for surprise \u2014 gives the reading somewhere to go."
      },
      {
        kind: "h2",
        text: "What makes a question work"
      },
      {
        kind: "p",
        text: "A good tarot question has three qualities. First, it is specific. Not \u201cWhat should I do with my life?\u201d but \u201cI have been offered a position in Berlin and I am afraid to leave Lisbon \u2014 what am I not seeing about this decision?\u201d The specificity is not limiting. It is the opposite. It gives the cards something concrete to illuminate."
      },
      {
        kind: "p",
        text: "Second, it is honest. Not the polished version you would tell a colleague, but the version you would tell yourself at three in the morning. If the real question is \u201cI am terrified of being alone,\u201d then asking \u201cShould I stay in this relationship?\u201d is going to produce a reading about loneliness anyway. Better to start there."
      },
      {
        kind: "p",
        text: "Third, it is open-ended. Questions that begin with \u201cHow\u201d or \u201cWhat\u201d tend to work better than \u201cWill\u201d or \u201cWhen.\u201d \u201cWill I get the promotion?\u201d leaves the cards almost nothing to do. \u201cWhat is standing between me and the work I actually want?\u201d opens a door."
      },
      {
        kind: "h2",
        text: "Questions that tend to struggle"
      },
      {
        kind: "list",
        items: [
          "Questions about other people\u2019s feelings or intentions. I cannot read someone who is not in the room, and attempting to is an invasion of their privacy.",
          "Questions designed to confirm a decision already made. If you have decided and need permission, a reading is not the place to find it.",
          "Questions so broad they have no edges. \u201cTell me about my future\u201d is not a question. It is an invitation to project.",
          "Timing questions. \u201cWhen will I meet someone?\u201d assumes a clockwork universe. I do not read in that universe."
        ]
      },
      {
        kind: "h2",
        text: "How to sharpen a question before a reading"
      },
      {
        kind: "p",
        text: "If you have booked a session and are unsure how to frame your question, try this: write down the situation in three or four sentences, as if explaining it to a thoughtful stranger who knows nothing about your life. Then look at what you wrote and ask yourself what you left out. The omission is usually the real question."
      },
      {
        kind: "p",
        text: "Another approach: notice the feeling that accompanies the question. If the question makes you slightly uncomfortable, slightly exposed, you are probably in the right territory. If it feels safe and tidy, you are probably still on the surface."
      },
      {
        kind: "h2",
        text: "You do not need a perfect question"
      },
      {
        kind: "p",
        text: "I should say, after all of this, that arriving with a messy question is perfectly acceptable. Part of my work is helping to shape the question in the first minutes of a reading. Many clients come in with something approximate \u2014 \u201cI\u2019m stuck\u201d or \u201cSomething needs to change\u201d \u2014 and we find the real question together. The cards are patient. So am I."
      },
      {
        kind: "p",
        text: "What matters is not perfection but willingness: the willingness to look at something you have been circling. The question is the door. It does not need to be beautiful. It just needs to open."
      }
    ]
  },
  {
    slug: "on-the-tower-and-frightening-cards",
    title: "On The Tower, and Why the Frightening Cards Are Rarely the Bad Ones",
    dek: "The cards that look like catastrophe often carry the most relief, and the gentle ones can be the hardest to hear.",
    excerpt: "New clients flinch when The Tower appears. I understand the instinct. But in nineteen years of reading, the cards that cause the most trouble are almost never the dramatic ones.",
    category: "The Cards",
    publishedAt: "2026-03-20",
    readingMinutes: 7,
    body: [
      {
        kind: "p",
        text: "There is a moment in almost every first reading when the client glances at the spread and tries to identify the bad card. They have seen tarot in films. They know, or think they know, that Death means death, that The Tower means ruin, that the Ten of Swords \u2014 a figure lying face-down with ten blades in his back \u2014 means exactly what it looks like. The fear is natural. The assumption behind it is almost always wrong."
      },
      {
        kind: "h2",
        text: "What The Tower actually depicts"
      },
      {
        kind: "p",
        text: "The Tower shows a tall stone structure struck by lightning. Two figures fall from it. Flames rise from the windows. It is, by any measure, the most violent image in the major arcana. And yet in my experience it is one of the most frequently relieving cards to lay on a table."
      },
      {
        kind: "p",
        text: "This is because The Tower does not predict disaster. It describes one. The disaster has usually already happened, or is happening now, or has been building so long that its arrival is not a surprise but a confirmation. The client who sees The Tower and feels a jolt of recognition \u2014 yes, this is falling apart \u2014 is not receiving bad news. She is receiving permission to name what she already knows."
      },
      {
        kind: "p",
        text: "The structure in the card is not a home. It is a prison that looked like a home. The lightning is not cruelty. It is the force that finally breaks open a situation that could not be broken open from the inside. After The Tower, there is rubble and open sky. Both are real. Both matter."
      },
      {
        kind: "h2",
        text: "The cards that actually sting"
      },
      {
        kind: "p",
        text: "If The Tower is dramatic but often welcome, which cards are difficult? In my experience, the hard ones are quiet. The Four of Cups: a figure sitting under a tree, arms crossed, ignoring a cup being offered to him. It is a picture of refusal \u2014 not dramatic refusal, but the low-grade, habitual kind. The kind where you stop noticing what is available because you have decided nothing good is coming."
      },
      {
        kind: "p",
        text: "Or the Two of Swords: a blindfolded woman holding two crossed blades, the sea behind her. She is at a decision point and has chosen not to decide. This is not a crisis. It is a stall. And stalls, unlike crises, can last for years."
      },
      {
        kind: "p",
        text: "These cards do not alarm anyone at first glance. They are visually calm. But they name something that is harder to face than catastrophe: the slow, voluntary refusal to move."
      },
      {
        kind: "h2",
        text: "Death, briefly"
      },
      {
        kind: "p",
        text: "I should address the card everyone asks about. Death does not mean death. In every tarot tradition I am aware of, it signifies transformation \u2014 the end of one phase and the necessary clearing before the next. It is a card about composting, not about funerals. I have never once laid the Death card and meant, or been understood to mean, that someone was going to die. If a reader tells you otherwise, leave the table."
      },
      {
        kind: "h2",
        text: "Why this matters"
      },
      {
        kind: "p",
        text: "Understanding that the frightening cards are rarely the dangerous ones is not just reassurance. It changes how you sit with a reading. If you are braced for bad news, you cannot hear what the cards are actually saying. If you approach the spread as a set of descriptions rather than verdicts, the whole practice opens up. The cards are not judges. They are mirrors with better lighting."
      },
      {
        kind: "p",
        text: "I say this not to strip the tarot of its gravity \u2014 the gravity is real and earned \u2014 but to strip it of its theatre. The work is serious. The images are powerful. But powerful is not the same as punishing, and serious is not the same as grim."
      }
    ]
  },
  {
    slug: "reading-for-grief",
    title: "Reading for Grief",
    dek: "When the question has no answer and the cards are not asked to solve but to sit alongside what cannot be repaired.",
    excerpt: "Grief does not come with a question that can be answered. A reading in grief is not about direction. It is about recognition \u2014 seeing the shape of what has been lost.",
    category: "Reflections",
    publishedAt: "2025-11-08",
    readingMinutes: 8,
    body: [
      {
        kind: "p",
        text: "Not every question has an answer. This is a difficult thing to say on a website that is, at some level, inviting you to pay me to answer questions. But it is the truth, and it matters most in the territory of grief."
      },
      {
        kind: "p",
        text: "People who come to a reading in grief are not looking for direction. They are not choosing between two paths. The path they were on has ended, and they are standing in the clearing where it stopped, and there is no map because the place they want to go \u2014 back \u2014 does not exist. The question they carry is not \u201cWhat should I do?\u201d It is \u201cHow do I live in a world where this has happened?\u201d"
      },
      {
        kind: "p",
        text: "I cannot answer that question. No one can. But I have learned, over many years and many readings, that there is value in sitting with it properly."
      },
      {
        kind: "h2",
        text: "What changes in a grief reading"
      },
      {
        kind: "p",
        text: "The first thing that changes is the purpose of the cards. In a decision reading, the spread is diagnostic: it names forces, tensions, options. In a grief reading, the spread is descriptive. It is not trying to solve anything. It is trying to give the loss a shape \u2014 to put it on the table in images that are bearable to look at, so that the person sitting across from me does not have to carry the whole weight of it internally."
      },
      {
        kind: "p",
        text: "This is not as small as it sounds. Grief is, among other things, an experience of formlessness. The world has changed its rules without warning, and the old categories \u2014 past and future, important and trivial, mine and not mine \u2014 have blurred. A spread of cards does something very simple: it imposes a structure. Not a solution. A frame."
      },
      {
        kind: "h2",
        text: "The cards I see most often"
      },
      {
        kind: "p",
        text: "In grief readings, certain cards recur. The Five of Cups appears more than any other: a cloaked figure looking down at three spilled cups, two still standing behind her. It is a devastatingly precise image. The focus is on what has been lost. The remaining cups are real, but they are not yet visible. The card does not say \u201cLook on the bright side.\u201d It says \u201cThis is where your gaze is, and that is understandable, and there are things still standing that you will notice when you are ready.\u201d"
      },
      {
        kind: "p",
        text: "The Three of Swords \u2014 a heart pierced by three blades, rain behind it \u2014 appears often too. It is literal in a way that is almost uncomfortably direct. Sometimes the most useful thing a card can do is confirm what a person already feels: yes, this is as painful as you think it is. You are not exaggerating."
      },
      {
        kind: "h2",
        text: "What I do not do in these readings"
      },
      {
        kind: "p",
        text: "I do not offer messages from the dead. I do not claim to communicate with anyone who is not in the room. If a client asks me to, I explain gently that this is not what I do and not what I believe the cards do. There are mediums who offer that work. I am not one of them."
      },
      {
        kind: "p",
        text: "I also do not offer comfort in the therapeutic sense. I am not a grief counsellor. If someone is in acute distress, I will say plainly that a therapist is the right person to speak to, and I can provide a referral. A tarot reading is not a substitute for professional care, and pretending otherwise would be irresponsible."
      },
      {
        kind: "h2",
        text: "What I can offer"
      },
      {
        kind: "p",
        text: "What I can offer is attention. An hour of careful, structured attention to the shape of a loss and the life around it. The cards give us something to look at together that is neither clinical nor sentimental. They are old images, drawn by people who understood that grief is not a problem to be solved but a condition to be lived through. Sometimes being seen clearly in that condition is enough. Not enough to fix anything. Enough to continue."
      }
    ]
  },
  {
    slug: "a-short-history-of-the-tarot-deck",
    title: "A Short History of the Tarot Deck",
    dek: "From Milanese card game to divinatory tool: the real, verifiable story of how seventy-eight cards found their second life.",
    excerpt: "The tarot deck began as a card game in fifteenth-century northern Italy. Its transformation into a tool for divination came much later, and the route was stranger than most accounts suggest.",
    category: "The Cards",
    publishedAt: "2025-07-14",
    readingMinutes: 8,
    body: [
      {
        kind: "p",
        text: "The tarot did not begin as a system of divination. It began as a card game, most likely in northern Italy in the first half of the fifteenth century. The earliest surviving decks \u2014 fragmentary, hand-painted, made for aristocratic patrons \u2014 date from the 1440s and are associated with the Visconti and Sforza families of Milan. These are not occult objects. They are game pieces, lavishly decorated, commissioned by the same courts that commissioned altarpieces and jousting armour."
      },
      {
        kind: "h2",
        text: "The game itself"
      },
      {
        kind: "p",
        text: "The game, known as trionfi and later as tarocchi, worked roughly like a trick-taking card game with an added set of trump cards \u2014 the images we now call the major arcana. The twenty-two trumps depicted allegorical figures: The Pope, The Wheel of Fortune, The Hanged Man, Death. These were not mysterious symbols to fifteenth-century Italians. They were part of a shared visual culture, drawn from religious art, classical mythology and the triumph processions that gave the game its name."
      },
      {
        kind: "p",
        text: "The four suits \u2014 cups, coins, swords and batons \u2014 corresponded to the suits of existing Italian playing cards. The addition of the trump sequence was the innovation, and it was a gaming innovation, not a spiritual one."
      },
      {
        kind: "h2",
        text: "From Italy outwards"
      },
      {
        kind: "p",
        text: "Over the following century, tarot cards spread across Europe as a game. By the sixteenth century, French card makers in Marseille were producing the pattern that would become the most widely recognised tarot design: the Tarot de Marseille. These decks were woodblock-printed rather than hand-painted, making them far cheaper and more widely available. The images became standardised \u2014 the same compositions, the same colour palette, repeated across thousands of decks with minor regional variations."
      },
      {
        kind: "p",
        text: "It is worth pausing here to note that for roughly three hundred years, from the mid-fifteenth to the mid-eighteenth century, the tarot was simply a card game. A popular one, played across Italy and France, but a card game nonetheless. No one was reading fortunes with these cards. No one was writing books about their hidden symbolism."
      },
      {
        kind: "h2",
        text: "The occult turn"
      },
      {
        kind: "p",
        text: "The transformation began in 1781, when Antoine Court de G\u00e9belin, a French Protestant clergyman and amateur scholar, published an essay claiming that the tarot trumps were remnants of an ancient Egyptian book of wisdom \u2014 the lost Book of Thoth. There was no evidence for this. Court de G\u00e9belin did not read Egyptian hieroglyphs (no European could at that date) and his theory was, by modern standards, entirely fabricated. But it was compelling, and it landed in a culture that was hungry for ancient wisdom and secret knowledge."
      },
      {
        kind: "p",
        text: "Within a few years, a Parisian fortune-teller known as Etteilla had published the first systematic method for reading tarot cards as a divinatory tool. Etteilla assigned specific divinatory meanings to each card, created dedicated spreads, and offered consultations. He was, in effect, the first professional tarot reader in the modern sense."
      },
      {
        kind: "h2",
        text: "The nineteenth century and beyond"
      },
      {
        kind: "p",
        text: "From there, the tarot\u2019s association with occultism deepened rapidly. Eliphas L\u00e9vi, writing in the 1850s and 1860s, connected the trumps to the Kabbalistic Tree of Life and to Hebrew letters. The Hermetic Order of the Golden Dawn, a late-nineteenth-century magical society based in London, made the tarot central to its symbolic system. It was within this tradition that Arthur Edward Waite and the artist Pamela Colman Smith created the Rider-Waite deck in 1909 \u2014 the deck that most English-speaking readers still learn on, and the one whose imagery has become almost synonymous with tarot itself."
      },
      {
        kind: "p",
        text: "Smith\u2019s contribution is often underestimated. She was the first artist to give every card in the minor arcana a fully illustrated scene rather than a simple arrangement of suit symbols. This was a radical design decision. It meant that a reader could interpret the Seven of Swords or the Three of Pentacles by looking at the image, not just by memorising a table of meanings. It made tarot reading accessible in a way it had never been before."
      },
      {
        kind: "h2",
        text: "What the history tells us"
      },
      {
        kind: "p",
        text: "The tarot\u2019s divinatory life is roughly two hundred and fifty years old. Its life as a game is roughly six hundred. It is not ancient. It is not Egyptian. It was not designed by sages or encoded with hidden wisdom. It was designed by card painters and game makers, and it was repurposed by occultists, fortune-tellers and eventually by readers like me, who find in its images a vocabulary for talking about human situations that is richer and stranger than anything we could invent from scratch."
      },
      {
        kind: "p",
        text: "I find this honest history more interesting than the mythologised version. The cards do not need a false origin to be powerful. They have earned their weight through use \u2014 through six centuries of human hands shuffling, cutting and laying them out, looking for the pattern that makes the next thing visible."
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export const faqs: Faq[] = [
  {
    question: "What happens if I am late to my session?",
    answer: "If you are up to ten minutes late, we will use the remaining time. Beyond that, the session counts as a missed appointment and is non-refundable, though I am happy to help you rebook at the next available slot. I keep a buffer between readings, so running over into another client\u2019s time is not possible.",
    group: "Practical matters"
  },
  {
    question: "Are readings recorded?",
    answer: "I do not record sessions, and I ask that you do not record them either without discussing it with me first. However, every reading is followed by a written summary sent within forty-eight hours. The summary covers the spread, the card positions and my interpretation, so you have a lasting reference without needing a recording.",
    group: "During the reading"
  },
  {
    question: "Can you predict death or illness?",
    answer: "No, and I will not attempt to. Tarot is not a medical or diagnostic tool. If a card like Death appears, it signifies transformation and the end of a phase, not a literal event. I will never make claims about your health. Questions about illness belong with your doctor, and I will say so directly if they arise.",
    group: "Before you book"
  },
  {
    question: "Can you read for someone who is not present?",
    answer: "I prefer not to. Reading for a third party raises questions of consent \u2014 they have not asked for a reading and are not present to respond. I can, however, read for your relationship to that person, or for a situation that involves them, with you as the focus. That is a meaningful distinction and usually gives you what you need.",
    group: "Before you book"
  },
  {
    question: "How far in advance should I book?",
    answer: "I typically have availability within two to three weeks. Occasionally sooner. If your situation is time-sensitive, mention that when you write and I will do what I can. I do not keep a formal waiting list, but if nothing is available, I will let you know when the next opening is likely to appear.",
    group: "Practical matters"
  },
  {
    question: "What if I do not like what I hear?",
    answer: "That is your right, and it does not offend me. A reading is not a verdict. It is an interpretation, and you are free to disagree with it. If something I say does not resonate, say so \u2014 we can look at the card again, approach it differently, or simply set it aside. I would rather you leave with honest doubt than false comfort.",
    group: "During the reading"
  },
  {
    question: "What is your cancellation and rescheduling policy?",
    answer: "You may cancel or reschedule with at least forty-eight hours\u2019 notice for a full refund. Cancellations within forty-eight hours are non-refundable but may be rescheduled once, subject to availability. I understand that life is unpredictable, and I handle genuine emergencies with flexibility. Please just let me know as soon as you can.",
    group: "Practical matters"
  },
  {
    question: "Does tarot conflict with religious belief?",
    answer: "That depends on your tradition and your own convictions, and it is not my place to decide for you. I can tell you that many of my clients hold religious beliefs, and they find the practice compatible with their faith. Others do not, and that is equally valid. I do not frame tarot as a spiritual practice. I treat the cards as a symbolic tool, not a sacred one.",
    group: "Before you book"
  },
  {
    question: "What technology do I need for a video reading?",
    answer: "A stable internet connection, a computer or tablet with a camera, and a quiet room. I use a standard video conferencing platform and will send you a link before the session. A phone works in a pinch, but a larger screen lets you see the cards as I lay them, which matters.",
    group: "Practical matters"
  },
  {
    question: "I have never had a reading. Should I start with a shorter session?",
    answer: "A single-question reading is a good starting point if you are uncertain. It is shorter, less expensive, and gives you a clear sense of how I work without a large commitment. That said, many first-time clients book a full session and do well with it. There is no wrong entry point.",
    group: "Before you book"
  },
  {
    question: "What if my question is really about a medical or legal matter?",
    answer: "I will tell you so, kindly and directly, and I will suggest you speak with the appropriate professional. This is not a refusal to help. It is a recognition that some questions require expertise I do not have and should not pretend to. We can still explore the emotional or personal dimensions of the situation if you wish.",
    group: "During the reading"
  },
  {
    question: "What forms of payment do you accept?",
    answer: "I accept bank transfer and major credit cards. Payment is due at the time of booking. All prices are listed in euros. If you are paying from outside the eurozone, your bank will handle the conversion. I do not accept cryptocurrency.",
    group: "Practical matters"
  },
  {
    question: "What languages do you read in?",
    answer: "English and Portuguese. You are welcome to speak whichever is more natural to you, and I will match it. If your question is complex and your English or Portuguese is limited, let me know in advance so we can discuss whether the session will work well or whether a written exchange might suit you better.",
    group: "Before you book"
  },
  {
    question: "How does the written reading arrive?",
    answer: "Within forty-eight hours of your session, I send a written summary by email as a PDF. It includes the spread layout, the cards drawn, their positions, my interpretation, and any additional observations. The document is typically three to five pages. It is yours to keep, revisit, and refer back to whenever you need it.",
    group: "Afterwards"
  }
];
