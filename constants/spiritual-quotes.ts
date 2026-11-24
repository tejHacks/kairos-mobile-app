/**
 * Daily Wisdom: quotes from Christian preachers and teachers.
 *
 * Rules for this list:
 * - Christian ministers and writers only.
 * - Every quote must trace to a named book, sermon or journal (`source`).
 *   No paraphrases, no "inspired by", nothing we cannot point back to.
 * - Wording is copied as published. Where a quote is a shortened form of a
 *   longer passage, it is cut at a sentence boundary, never reworded.
 */

export interface DailyQuote {
  text: string;
  author: string;
  /** Book, sermon or journal the quote comes from */
  source: string;
}

export const dailyQuotes: DailyQuote[] = [
  // ── Kenneth E. Hagin ──
  {
    text: "When you know the Word of God, it will change you.",
    author: "Kenneth E. Hagin",
    source: "Your Faith in God Will Work",
  },
  {
    text: "If you stand by the Word, God will stand by you and will make His Word good in your life.",
    author: "Kenneth E. Hagin",
    source: "Bible Prayer Study Course",
  },
  {
    text: "Prayer is successful only when it is based on the promises in God's Word!",
    author: "Kenneth E. Hagin",
    source: "Biblical Ways to Receive Healing",
  },
  {
    text: "Do what God says do. Endeavor to be faithful, no matter what happens or what comes. And leave the results to God.",
    author: "Kenneth E. Hagin",
    source: "The Believer's Authority",
  },
  {
    text: "Years ago on the flyleaf of my Bible I wrote in red ink, “The Bible says it, I believe it, and that settles it.”",
    author: "Kenneth E. Hagin",
    source: "Bible Prayer Study Course",
  },
  {
    text: "Know the facts of God\u2019s Word\u2014what belongs to you and who you are in Him.",
    author: "Kenneth E. Hagin",
    source: "Your Faith in God Will Work",
  },
  {
    text: "Our confession will either imprison us or set us free.",
    author: "Kenneth E. Hagin",
    source: "Right and Wrong Thinking",
  },
  {
    text: "People keep on struggling when it comes to prayer and faith because they don't actually believe what the Word says.",
    author: "Kenneth E. Hagin",
    source: "Bible Prayer Study Course",
  },

  // ── Bishop David Oyedepo ──
  {
    text: "Miracles are nothing but confirmation of the word received, believed, and put to work.",
    author: "Bishop David Oyedepo",
    source: "Faith for Exploits (sermon, 2025)",
  },
  {
    text: "God's presence is what makes us more than conquerors over the battles of life.",
    author: "Bishop David Oyedepo",
    source: "Engaging the Power of Praise for a Supernatural Turnaround (sermon, 2019)",
  },
  {
    text: "Satan is not permitted to prevail where you dwell.",
    author: "Bishop David Oyedepo",
    source: "Breaking Generational Curses (sermon, 2012)",
  },
  {
    text: "Self-discipline is operating without requiring supervision.",
    author: "Bishop David Oyedepo",
    source: "Understanding the Demands of Discipline (sermon)",
  },
  {
    text: "Discipline is indeed the price for greatness.",
    author: "Bishop David Oyedepo",
    source: "Understanding the Demands of Discipline (sermon)",
  },
  {
    text: "You are blessed primarily to be a blessing to the kingdom.",
    author: "Bishop David Oyedepo",
    source: "Why and How God Blesses (2004)",
  },

  // ── Archbishop Benson Idahosa ──
  {
    text: "No man or devil can stop the Gospel of the Kingdom.",
    author: "Archbishop Benson Idahosa",
    source: "You Are God's Battle Axe",
  },
  {
    text: "The Gospel is the truth and the truth can never be suppressed for long: it resurfaces, no matter how deep it is submerged.",
    author: "Archbishop Benson Idahosa",
    source: "You Are God's Battle Axe",
  },
  {
    text: "Believe the Gospel, and He that sits at the right Hand of the Father shall plead your case.",
    author: "Archbishop Benson Idahosa",
    source: "You Are God's Battle Axe",
  },
  {
    text: "If you have a vision and you do not act on it, it will die.",
    author: "Archbishop Benson Idahosa",
    source: "You Are God's Battle Axe",
  },
  {
    text: "You must speak what God has already ordained you to be and it will come to pass. Change it from dream to reality. Turn excuses to uses. Turn your inabilities to God's ability.",
    author: "Archbishop Benson Idahosa",
    source: "I Choose to Change",
  },
  {
    text: "Your way of life, how you live and conduct your life, determines to a great extent your success or failure.",
    author: "Archbishop Benson Idahosa",
    source: "I Choose to Change",
  },

  // ── Reinhard Bonnke ──
  {
    text: "The church is a lifeboat, not a pleasure boat.",
    author: "Reinhard Bonnke",
    source: "Evangelism by Fire",
  },

  // ── F. F. Bosworth ──
  {
    text: "Faith begins where the will of God is known.",
    author: "F. F. Bosworth",
    source: "Christ the Healer",
  },

  // ── E. M. Bounds ──
  {
    text: "Men are God's method. The Church is looking for better methods; God is looking for better men.",
    author: "E. M. Bounds",
    source: "Power Through Prayer",
  },
  {
    text: "The Holy Ghost does not flow through methods, but through men.",
    author: "E. M. Bounds",
    source: "Power Through Prayer",
  },
  {
    text: "What the Church needs to-day is not more machinery or better, not new organizations or more and novel methods, but men whom the Holy Ghost can use\u2014men of prayer, men mighty in prayer.",
    author: "E. M. Bounds",
    source: "Power Through Prayer",
  },

  // ── Leonard Ravenhill ──
  {
    text: "No man is greater than his prayer life.",
    author: "Leonard Ravenhill",
    source: "Why Revival Tarries",
  },
  {
    text: "The pastor who is not praying is playing; the people who are not praying are straying.",
    author: "Leonard Ravenhill",
    source: "Why Revival Tarries",
  },

  // ── A. W. Tozer ──
  {
    text: "What comes into our minds when we think about God is the most important thing about us.",
    author: "A. W. Tozer",
    source: "The Knowledge of the Holy",
  },
  {
    text: "To have found God and still to pursue Him is the soul's paradox of love.",
    author: "A. W. Tozer",
    source: "The Pursuit of God",
  },

  // ── Dietrich Bonhoeffer ──
  {
    text: "When Christ calls a man, he bids him come and die.",
    author: "Dietrich Bonhoeffer",
    source: "The Cost of Discipleship",
  },
  {
    text: "Cheap grace is the deadly enemy of our Church.",
    author: "Dietrich Bonhoeffer",
    source: "The Cost of Discipleship",
  },

  // ── Augustine of Hippo ──
  {
    text: "Thou madest us for Thyself, and our heart is restless, until it repose in Thee.",
    author: "Augustine of Hippo",
    source: "Confessions, Book I",
  },

  // ── C. S. Lewis ──
  {
    text: "I believe in Christianity as I believe that the sun has risen: not only because I see it, but because by it I see everything else.",
    author: "C. S. Lewis",
    source: "Is Theology Poetry? (The Weight of Glory)",
  },

  // ── Jim Elliot ──
  {
    text: "He is no fool who gives what he cannot keep to gain what he cannot lose.",
    author: "Jim Elliot",
    source: "Journal, 28 October 1949",
  },
];
