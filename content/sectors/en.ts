import type { Sector } from './types'

export const sectorsEn: Sector[] = [
  {
    key: 'dance',
    slug: 'dance-studio-software',
    name: 'Dance schools',
    cardText: 'Salsa, ballet, hip hop: packages per dance style, attendance and instructor pay.',
    examples: ['Salsa', 'Bachata', 'Tango', 'Ballet', 'Hip hop', 'Contemporary', 'Kids ballet', 'Folk dance'],
    metaTitle: 'Dance studio software: attendance, class packages and instructor pay',
    description:
      'Management software for dance schools and studios. Class packages per dance style, attendance from your phone, automatic credit tracking, instructor pay and cash in one place.',
    keywords: ['dance studio software', 'dance school management software', 'dance class scheduling software', 'dance studio attendance app'],
    heroTitle: 'Attendance, packages and instructor pay for your dance school',
    heroLead:
      "A student's salsa package isn't charged for a bachata class, instructor pay comes straight from attendance, and students running out of credits show up on your home screen.",
    pains: [
      { title: 'Credits get mixed up', text: 'When a student has packages for two dance styles, a paper register soon loses track of which class used which package.' },
      { title: 'Month-end pay disputes', text: 'Classes taught, cover teachers and different rates worked out by hand never quite add up.' },
      { title: 'Renewals slip', text: "If nobody notices a student's credits ran out when they walk in, the renewal waits for weeks." },
    ],
    fit: [
      { title: 'Packages per dance style', text: 'Packages are tied to a dance style; attendance takes the credit from the right package.' },
      { title: 'Attendance from your phone', text: 'At the end of class the instructor marks everyone present and taps only the ones who missed it.' },
      { title: 'Invite by level', text: 'Label students and classes "Beginner, Intermediate, Advanced"; when the intermediate class has a free place, invite same-level students in one tap.' },
      { title: 'Instructor pay', text: 'Rates per instructor, branch and dance style; pay is worked out from attendance.' },
    ],
    setup: {
      title: 'Example setup',
      items: [
        'Class types: Salsa, Bachata, Tango',
        'Packages: 4 salsa classes (1 month), 8 salsa classes (2 months)',
        'Classes: Salsa beginners (Tue 19:00), Salsa intermediate (Thu 20:00)',
        'Labels: Beginner, Intermediate, Advanced',
      ],
    },
    faq: [
      { q: 'Can a student have packages for more than one style?', a: 'Yes. Each package belongs to a dance style; whichever class the student attends, the credit comes from that style’s package.' },
      { q: 'How are partner classes tracked?', a: 'Each student is recorded separately and uses their own package. Partner pairing isn’t tracked in the app at the moment.' },
      { q: 'Can I announce shows and events?', a: 'Yes. From the Messages screen you can open a WhatsApp or SMS message from a ready event template on your phone in one tap.' },
    ],
    blogKeys: ['software-features', 'packages', 'instructor-pay'],
  },
  {
    key: 'pilates_yoga',
    slug: 'pilates-yoga-studio-software',
    name: 'Pilates and yoga studios',
    cardText: 'Packages, attendance and instructor pay for reformer, mat and yoga classes.',
    examples: ['Reformer Pilates', 'Mat Pilates', 'Hatha yoga', 'Vinyasa', 'Yin yoga', 'Prenatal Pilates', 'Private session'],
    metaTitle: 'Pilates and yoga studio software: packages, attendance and instructor pay',
    description:
      'Management software for Pilates and yoga studios. Reformer and mat packages, weekly group classes, attendance from your phone, credit tracking, instructor pay and cash.',
    keywords: ['pilates studio software', 'yoga studio software', 'reformer pilates management software', 'pilates class tracking app'],
    heroTitle: 'Package and attendance tracking for your Pilates and yoga studio',
    heroLead:
      'Keep reformer and mat packages apart, take attendance on your phone at the end of class, and work out instructor pay per class or per hour straight from attendance.',
    pains: [
      { title: 'Reformer and mat are different', text: 'A reformer class costs more than mat; a single “classes left” number soon hides which kind is left.' },
      { title: 'Packages expire', text: 'Pilates packages usually have an expiry date. If nobody warns the student in time, classes are lost and the student is upset.' },
      { title: 'Different pay models', text: 'One instructor is paid per class, another per hour or per student; the month-end sums take hours by hand.' },
    ],
    fit: [
      { title: 'Packages per class type', text: 'Reformer and mat are separate class types; packages belong to one and credits come from the right package.' },
      { title: 'Expiry and credit alerts', text: 'Students low on credits or whose package ends within 7 days are listed; open a reminder message in one tap.' },
      { title: 'Flexible instructor pay', text: 'Pay as a share of the class value, per class, per hour or per student, with an optional minimum.' },
      { title: 'Private sessions', text: 'Set up a one-student class to track private sessions in the same place with the same packages.' },
    ],
    setup: {
      title: 'Example setup',
      items: [
        'Class types: Reformer Pilates, Mat Pilates, Yoga',
        'Packages: 8 reformer classes (5 weeks), 12 mat classes (2 months)',
        'Classes: Morning reformer (Mon & Wed 09:00), Evening yoga (Tue 19:30)',
        'Instructor pay: per class for reformer, hourly for yoga',
      ],
    },
    faq: [
      { q: 'Can students book their own classes online?', a: 'Not at the moment. StudioDesk is used by the studio team; the team handles sign-ups and attendance.' },
      { q: 'Can I cap reformer class size?', a: 'Per-class capacity limits aren’t available yet. Each class page shows the students enrolled, so you can keep an eye on group size.' },
      { q: 'What happens to credits when a package expires?', a: 'An expired package can’t be used and attendance won’t take credits from it. Students whose package is about to end appear on the home screen and in Messages.' },
    ],
    blogKeys: ['pilates-yoga', 'packages', 'teacher-pay'],
  },
  {
    key: 'martial_arts',
    slug: 'martial-arts-school-software',
    name: 'Martial arts schools',
    cardText: 'Karate, taekwondo, kickboxing: belt levels, monthly packages and attendance.',
    examples: ['Karate', 'Taekwondo', 'Kickboxing', 'Judo', 'Boxing', 'Muay Thai', 'Aikido', 'Kids group'],
    metaTitle: 'Martial arts school software: attendance, monthly fees and belt levels',
    description:
      'Management software for karate, taekwondo, judo and kickboxing schools. Monthly packages, groups by belt level, attendance from your phone, parent messages and cash.',
    keywords: ['martial arts school software', 'karate school management software', 'taekwondo school software', 'dojo management app'],
    heroTitle: 'Attendance, monthly fees and belt levels for your martial arts school',
    heroLead:
      'Keep belt levels as labels, track monthly packages and attendance in one place, and send payment reminders to parents from your phone.',
    pains: [
      { title: 'Monthly fees', text: 'Who has paid this month and who is late gets lost in a notebook or a separate spreadsheet.' },
      { title: 'Level groups', text: 'Who belongs in the white, yellow or green belt group lives only in the instructor’s head.' },
      { title: 'Reaching parents', text: 'Most students are children; messaging each parent about schedule changes or payments takes hours.' },
    ],
    fit: [
      { title: 'Belt levels as labels', text: 'Label students and groups “White belt, Yellow belt…”; filter by level and invite same-level students when a group has room.' },
      { title: 'Monthly packages', text: 'Sell the monthly fee as a package such as “8 classes, valid 1 month”; packages about to end are listed.' },
      { title: 'Messages to parents', text: 'Payment reminders or announcements open as WhatsApp or SMS messages from ready templates, sent to the number on the student record.' },
      { title: 'Change groups', text: 'Move a student who earned a new belt to their new group in one step from their profile; past attendance is kept.' },
    ],
    setup: {
      title: 'Example setup',
      items: [
        'Class types: Karate, Kickboxing',
        'Packages: Monthly karate (8 classes, 1 month), Monthly kickboxing (12 classes, 1 month)',
        'Classes: Little ones (Tue & Thu 17:00), Juniors (Tue & Thu 18:30), Adults (Mon & Wed 20:00)',
        'Labels: White belt, Yellow belt, Green belt, Black belt',
      ],
    },
    faq: [
      { q: 'Can I track belt gradings?', a: 'Belt level is kept as a label and every change is recorded in the student’s history. There is no separate grading calendar or grading fee module yet; you can add the fee to the cash register as income.' },
      { q: 'We charge a fixed monthly fee. Do credits fit?', a: 'Set up the monthly fee as a package valid for 1 month with as many credits as classes in that month. Attendance uses the credits and the package ends with the month.' },
      { q: 'Where do I keep parent details?', a: 'Put the parent’s number in the student’s phone field and any extra details in the notes. Messages go to that number.' },
    ],
    blogKeys: ['martial-arts', 'packages', 'retention'],
  },
  {
    key: 'music_art',
    slug: 'music-art-school-software',
    name: 'Music and art schools',
    cardText: 'Guitar, piano, painting: private and group lessons, packages and teacher pay.',
    examples: ['Guitar', 'Piano', 'Violin', 'Singing', 'Drums', 'Painting', 'Ceramics', 'Drama'],
    metaTitle: 'Music and art school software: private lessons, packages and teacher pay',
    description:
      'Management software for music schools, art workshops and drama classes. Private and group lessons, lesson packages, attendance, teacher pay and cash.',
    keywords: ['music school software', 'music lesson management software', 'art school management software', 'private lesson tracking app'],
    heroTitle: 'Lessons, packages and teacher pay for your music or art school',
    heroLead:
      'Run one-to-one lessons and group workshops on the same timetable. Lessons left, each teacher’s month-end pay and your cash in one place.',
    pains: [
      { title: 'Lots of private lessons', text: 'Each teacher has dozens of private lessons a week; which student has how many lessons left can’t be tracked by hand.' },
      { title: 'Settling with teachers', text: 'Teachers are paid per lesson or per hour; cancelled and make-up lessons make the month-end sums messy.' },
      { title: 'Terms and workshops', text: 'Group workshops open by term; sign-ups, payments and attendance end up on different lists.' },
    ],
    fit: [
      { title: 'Private lesson = one-student class', text: 'Set up each one-to-one lesson as a class with one student; attendance, credits and teacher pay work just like group classes.' },
      { title: 'Per-lesson or hourly pay', text: 'Pay teachers per lesson, per hour or as a share of the lesson value; the month-end statement comes from attendance.' },
      { title: 'Groups by level', text: 'Use labels to separate beginners from advanced students and invite the right students to a new group.' },
      { title: 'Concert and exhibition news', text: 'Open an event announcement to all students or one group from a template in one tap.' },
    ],
    setup: {
      title: 'Example setup',
      items: [
        'Class types: Guitar, Piano, Painting',
        'Packages: 4 guitar lessons (1 month), 8 piano lessons (2 months), Painting workshop (10 weeks)',
        'Classes: Ayşe – private guitar (Mon 17:00), Kids painting workshop (Sat 11:00)',
        'Teacher pay: per lesson for private lessons, hourly for workshops',
      ],
    },
    faq: [
      { q: 'Isn’t a class per private lesson a lot of work?', a: 'A class is set up once and repeats every week. If a student’s time changes, you move them to another class from their profile in one step.' },
      { q: 'Can I record make-up lessons?', a: 'You can take attendance for a past day afterwards and mark the make-up lesson on that day. Credits are used only when attendance is saved.' },
      { q: 'Can teachers see their own lessons?', a: 'Yes. Someone signed in with the instructor role can take attendance and sees only their own records on the pay screens.' },
    ],
    blogKeys: ['music-art', 'instructor-pay', 'scheduling'],
  },
  {
    key: 'fitness',
    slug: 'fitness-class-software',
    name: 'Boutique fitness and group classes',
    cardText: 'HIIT, spinning, functional training: packages, attendance and instructor pay.',
    examples: ['HIIT', 'Spinning', 'Functional training', 'Zumba', 'CrossFit', 'Body pump', 'Kangoo', 'Stretching'],
    metaTitle: 'Boutique fitness and group class software: packages, attendance and pay',
    description:
      'Management software for boutique fitness studios and group class gyms. Class packages, drop-in classes, attendance from your phone, instructor pay and cash.',
    keywords: ['fitness studio software', 'group fitness class software', 'boutique gym management software', 'spinning studio software'],
    heroTitle: 'Packages, attendance and instructor pay for your boutique fitness studio',
    heroLead:
      'Set up your weekly group classes once, sell packages and take attendance on your phone at the end of class. Instructor pay and cash are ready at month end.',
    pains: [
      { title: 'Many classes, many instructors', text: 'With dozens of group classes a week and rotating instructors, who taught what and how many came gets lost.' },
      { title: 'Drop-ins', text: 'Members who come for a single class without a package scatter payments and attendance across different places.' },
      { title: 'No view of fill rates', text: 'Which slots are full and which are half-empty only shows at month end; low-attendance classes cost money.' },
    ],
    fit: [
      { title: 'Packages and drop-ins', text: 'Sell a drop-in as a one-class package; credits are tracked alongside every other package.' },
      { title: 'Cover instructors', text: 'Choose who actually taught when taking attendance; pay goes to the instructor who taught the class.' },
      { title: 'Class profitability', text: 'Each group’s lessons, average attendance, revenue and instructor cost side by side in one report.' },
      { title: 'Members low on credits', text: 'Members about to run out of credits are listed on the home screen; send a reminder in one tap.' },
    ],
    setup: {
      title: 'Example setup',
      items: [
        'Class types: HIIT, Spinning, Functional',
        'Packages: Drop-in, 10 classes (6 weeks), 20 classes (3 months)',
        'Classes: Morning HIIT (Mon, Wed, Fri 07:30), Evening spinning (Tue & Thu 19:00)',
        'Instructor pay: fixed per class, with a minimum when attendance is low',
      ],
    },
    faq: [
      { q: 'Can members sign up for classes themselves?', a: 'Not at the moment. The studio team handles sign-ups and attendance; members don’t use the app.' },
      { q: 'Can I offer an unlimited monthly membership?', a: 'Set up a package valid for 1 month with more credits than a member could use in that month; in practice that works as unlimited.' },
      { q: 'We have several branches. Are reports separate?', a: 'Yes. Timetables, rooms and cash are split by branch, and you manage every branch from one account.' },
    ],
    blogKeys: ['fitness', 'underfilled', 'cash'],
  },
]
