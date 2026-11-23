// constants/themes.ts

export interface ThemeVerse {
  text: string;
  ref: string;
}

export interface Theme {
  title: string;
  color: string;
  verses: ThemeVerse[];
}

export interface Themes {
  faith: Theme;
  hope: Theme;
  love: Theme;
  peace: Theme;
  joy: Theme;
  gratitude: Theme;
  strength: Theme;
  wisdom: Theme;
  grace: Theme;
  patience: Theme;
  courage: Theme;
  forgiveness: Theme;
}

export const themes: Themes = {
  faith: {
    title: "Faith",
    color: "#4A90E2",
    verses: [
      {
        text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
        ref: "Hebrews 11:1",
      },
      {
        text: "(For we walk by faith, not by sight:)",
        ref: "2 Corinthians 5:7",
      },
      {
        text: "But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.",
        ref: "Hebrews 11:6",
      },
      {
        text: "So then faith cometh by hearing, and hearing by the word of God.",
        ref: "Romans 10:17",
      },
      {
        text: "And Jesus said unto them, Because of your unbelief: for verily I say unto you, If ye have faith as a grain of mustard seed, ye shall say unto this mountain, Remove hence to yonder place; and it shall remove; and nothing shall be impossible unto you.",
        ref: "Matthew 17:20",
      },
    ],
  },
  hope: {
    title: "Hope",
    color: "#50C878",
    verses: [
      {
        text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.",
        ref: "Romans 15:13",
      },
      {
        text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
        ref: "Jeremiah 29:11",
      },
      {
        text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
        ref: "Isaiah 40:31",
      },
      {
        text: "Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.",
        ref: "Psalm 42:11",
      },
      {
        text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer;",
        ref: "Romans 12:12",
      },
    ],
  },
  love: {
    title: "Love",
    color: "#E74C3C",
    verses: [
      {
        text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,",
        ref: "1 Corinthians 13:4",
      },
      {
        text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        ref: "John 3:16",
      },
      {
        text: "And above all things have fervent charity among yourselves: for charity shall cover the multitude of sins.",
        ref: "1 Peter 4:8",
      },
      {
        text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.",
        ref: "1 Corinthians 13:13",
      },
      {
        text: "Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.",
        ref: "1 John 4:7",
      },
    ],
  },
  peace: {
    title: "Peace",
    color: "#9B59B6",
    verses: [
      {
        text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
        ref: "John 14:27",
      },
      {
        text: "The LORD will give strength unto his people; the LORD will bless his people with peace.",
        ref: "Psalm 29:11",
      },
      {
        text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.",
        ref: "Isaiah 26:3",
      },
      {
        text: "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.",
        ref: "Colossians 3:15",
      },
      {
        text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
        ref: "Philippians 4:6-7",
      },
    ],
  },
  joy: {
    title: "Joy",
    color: "#F39C12",
    verses: [
      {
        text: "Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our Lord: neither be ye sorry; for the joy of the LORD is your strength.",
        ref: "Nehemiah 8:10",
      },
      {
        text: "This is the day which the LORD hath made; we will rejoice and be glad in it.",
        ref: "Psalm 118:24",
      },
      {
        text: "Rejoice in the Lord alway: and again I say, Rejoice.",
        ref: "Philippians 4:4",
      },
      {
        text: "Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.",
        ref: "Psalm 16:11",
      },
      {
        text: "Whom having not seen, ye love; in whom, though now ye see him not, yet believing, ye rejoice with joy unspeakable and full of glory:",
        ref: "1 Peter 1:8",
      },
    ],
  },
  gratitude: {
    title: "Gratitude",
    color: "#E67E22",
    verses: [
      {
        text: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
        ref: "1 Thessalonians 5:18",
      },
      {
        text: "Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.",
        ref: "Psalm 100:4",
      },
      {
        text: "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.",
        ref: "Colossians 3:15",
      },
      {
        text: "I will praise thee, O LORD, with my whole heart; I will shew forth all thy marvellous works.",
        ref: "Psalm 9:1",
      },
      {
        text: "O give thanks unto the LORD, for he is good: for his mercy endureth for ever.",
        ref: "Psalm 107:1",
      },
    ],
  },
  strength: {
    title: "Strength",
    color: "#34495E",
    verses: [
      {
        text: "I can do all things through Christ which strengtheneth me.",
        ref: "Philippians 4:13",
      },
      {
        text: "The LORD is my strength and my shield; my heart trusted in him, and I am helped: therefore my heart greatly rejoiceth; and with my song will I praise him.",
        ref: "Psalm 28:7",
      },
      {
        text: "He giveth power to the faint; and to them that have no might he increaseth strength.",
        ref: "Isaiah 40:29",
      },
      {
        text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
        ref: "Joshua 1:9",
      },
      {
        text: "God is our refuge and strength, a very present help in trouble.",
        ref: "Psalm 46:1",
      },
    ],
  },
  wisdom: {
    title: "Wisdom",
    color: "#16A085",
    verses: [
      {
        text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
        ref: "James 1:5",
      },
      {
        text: "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.",
        ref: "Proverbs 9:10",
      },
      {
        text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
        ref: "Proverbs 3:5-6",
      },
      {
        text: "For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.",
        ref: "Proverbs 2:6",
      },
      {
        text: "But the wisdom that is from above is first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy.",
        ref: "James 3:17",
      },
    ],
  },
  grace: {
    title: "Grace",
    color: "#8E44AD",
    verses: [
      {
        text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:",
        ref: "Ephesians 2:8",
      },
      {
        text: "But he giveth more grace. Wherefore he saith, God resisteth the proud, but giveth grace unto the humble.",
        ref: "James 4:6",
      },
      {
        text: "And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.",
        ref: "2 Corinthians 12:9",
      },
      {
        text: "Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.",
        ref: "Hebrews 4:16",
      },
      {
        text: "And of his fulness have all we received, and grace for grace.",
        ref: "John 1:16",
      },
    ],
  },
  patience: {
    title: "Patience",
    color: "#27AE60",
    verses: [
      {
        text: "With all lowliness and meekness, with longsuffering, forbearing one another in love;",
        ref: "Ephesians 4:2",
      },
      {
        text: "Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.",
        ref: "Psalm 27:14",
      },
      {
        text: "But if we hope for that we see not, then do we with patience wait for it.",
        ref: "Romans 8:25",
      },
      {
        text: "The Lord is not slack concerning his promise, as some men count slackness; but is longsuffering to us-ward, not willing that any should perish, but that all should come to repentance.",
        ref: "2 Peter 3:9",
      },
      {
        text: "Be patient therefore, brethren, unto the coming of the Lord. Behold, the husbandman waiteth for the precious fruit of the earth, and hath long patience for it, until he receive the early and latter rain.",
        ref: "James 5:7",
      },
    ],
  },
  courage: {
    title: "Courage",
    color: "#C0392B",
    verses: [
      {
        text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
        ref: "Joshua 1:9",
      },
      {
        text: "Watch ye, stand fast in the faith, quit you like men, be strong.",
        ref: "1 Corinthians 16:13",
      },
      {
        text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
        ref: "Isaiah 41:10",
      },
      {
        text: "The LORD is on my side; I will not fear: what can man do unto me?",
        ref: "Psalm 118:6",
      },
      {
        text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
        ref: "2 Timothy 1:7",
      },
    ],
  },
  forgiveness: {
    title: "Forgiveness",
    color: "#3498DB",
    verses: [
      {
        text: "Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.",
        ref: "Colossians 3:13",
      },
      {
        text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
        ref: "1 John 1:9",
      },
      {
        text: "And when ye stand praying, forgive, if ye have ought against any: that your Father also which is in heaven may forgive you your trespasses.",
        ref: "Mark 11:25",
      },
      {
        text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
        ref: "Ephesians 4:32",
      },
      {
        text: "For if ye forgive men their trespasses, your heavenly Father will also forgive you:",
        ref: "Matthew 6:14",
      },
    ],
  },
};
