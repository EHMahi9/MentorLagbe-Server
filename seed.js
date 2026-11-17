import bcrypt from 'bcryptjs';
import { connectDB, getCollections } from './db.js';

async function seedData() {
  console.log('🌱 Starting MentorLagbe database seeding...');
  await connectDB();
  const { usersCollection, tuitionsCollection, applicationsCollection, paymentsCollection } =
    getCollections();

  // Clear existing collections
  await usersCollection.deleteMany({});
  await tuitionsCollection.deleteMany({});
  await applicationsCollection.deleteMany({});
  await paymentsCollection.deleteMany({});

  console.log('🧹 Existing collections cleared.');

  // Common password hash for test accounts: 'Admin@12345', 'Tutor@12345', 'Student@12345'
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@12345', salt);
  const tutorPassword = await bcrypt.hash('Tutor@12345', salt);
  const studentPassword = await bcrypt.hash('Student@12345', salt);

  // 1. Seed Users
  const users = [
    {
      name: 'Platform Admin',
      email: 'admin@mentorlagbe.com',
      password: adminPassword,
      role: 'admin',
      plan: 'pro',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      phone: '+880-1700-000001',
      bio: 'Head of Operations and Moderation at MentorLagbe platform.',
      createdAt: new Date('2026-10-01T10:00:00Z'),
    },
    {
      name: 'Karim Rahman',
      email: 'tutor@mentorlagbe.com',
      password: tutorPassword,
      role: 'tutor',
      plan: 'pro',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      phone: '+880-1700-000002',
      bio: 'Senior Mathematics & Computer Science Mentor with 8+ years of teaching experience. BUET Alumnus.',
      createdAt: new Date('2026-10-05T12:00:00Z'),
    },
    {
      name: 'Rafiq Hasan',
      email: 'rafiq.tutor@mentorlagbe.com',
      password: tutorPassword,
      role: 'tutor',
      plan: 'free',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      phone: '+880-1700-000003',
      bio: 'Data Science & Machine Learning Practitioner. Specializing in Python, AI, and Big Data mentorship.',
      createdAt: new Date('2026-10-10T14:00:00Z'),
    },
    {
      name: 'Nusrat Jahan',
      email: 'student@mentorlagbe.com',
      password: studentPassword,
      role: 'student',
      plan: 'free',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      phone: '+880-1700-000004',
      bio: 'Undergraduate student passionate about Artificial Intelligence and Advanced Calculus.',
      bookmarks: [],
      createdAt: new Date('2026-10-12T09:00:00Z'),
    },
    {
      name: 'Anika Rahman',
      email: 'anika@student.com',
      password: studentPassword,
      role: 'student',
      plan: 'pro',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
      phone: '+880-1700-000005',
      bio: 'HSC Science candidate preparing for Medical and Engineering entrance examinations.',
      bookmarks: [],
      createdAt: new Date('2026-10-15T11:00:00Z'),
    },
    {
      name: 'Tanvir Hossain',
      email: 'tanvir@student.com',
      password: studentPassword,
      role: 'student',
      plan: 'free',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      phone: '+880-1700-000006',
      bio: 'Aspiring Full-Stack Software Developer currently learning Next.js and TypeScript.',
      bookmarks: [],
      createdAt: new Date('2026-10-20T16:00:00Z'),
    },
  ];

  await usersCollection.insertMany(users);
  console.log(`✅ Seeded ${users.length} users.`);

  // 2. Seed Tuitions (14 realistic batches across subjects)
  const tuitions = [
    {
      title: 'Practical Data Science & Machine Learning with Python',
      subject: 'Data Science',
      classLevel: 'University',
      mode: 'Online',
      location: 'Online (Zoom & Colab)',
      monthlyFee: 6000,
      daysPerWeek: '4 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      description: 'Comprehensive hands-on mentorship covering NumPy, Pandas, Scikit-Learn, Deep Learning with PyTorch, and end-to-end ML production pipelines.',
      tutorName: 'Rafiq Hasan',
      tutorEmail: 'rafiq.tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-09T14:00:00Z'),
    },
    {
      title: 'Full-Stack JavaScript & MERN Stack Intensive Mentorship',
      subject: 'Web Development',
      classLevel: 'University',
      mode: 'Online',
      location: 'Online (Discord / Meet)',
      monthlyFee: 7500,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      description: 'Master React, Next.js App Router, Express, MongoDB, and Tailwind CSS through 5 industry-grade capstone projects and live code reviews.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-08T10:00:00Z'),
    },
    {
      title: 'University Advanced Calculus, Differential Equations & Linear Algebra',
      subject: 'Mathematics',
      classLevel: 'University',
      mode: 'Online',
      location: 'Online (Interactive Whiteboard)',
      monthlyFee: 5500,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
      description: 'Rigorous conceptual clarity for engineering students covering Multivariable Calculus, Vector Analysis, Fourier Transforms, and Matrix Algebra.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-04T12:00:00Z'),
    },
    {
      title: 'Organic Chemistry: Mechanism Drills & Synthesis Strategies',
      subject: 'Chemistry',
      classLevel: 'HSC',
      mode: 'Offline',
      location: 'Dhanmondi, Dhaka',
      monthlyFee: 3800,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
      description: 'Focus on electrophilic/nucleophilic reaction mechanisms, named reactions, conversions, and board exam question-solving with short-cut techniques.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-06T15:00:00Z'),
    },
    {
      title: 'IELTS Academic & General Training: Band 7.5+ Strategy Batch',
      subject: 'IELTS Preparation',
      classLevel: 'Professional',
      mode: 'Online',
      location: 'Online (Zoom Live Sessions)',
      monthlyFee: 5000,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
      description: 'Intensive module-wise practice for Reading, Listening, Speaking mock interviews, and Academic Writing Task 1 & 2 evaluation with personalized feedback.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-10-26T18:00:00Z'),
    },
    {
      title: 'High School Biology & Medical Admission Foundation Course',
      subject: 'Biology',
      classLevel: 'HSC',
      mode: 'Offline',
      location: 'Uttara, Dhaka',
      monthlyFee: 3200,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
      description: 'Human physiology, botany, genetics, and molecular biology with diagnostic tests tailored for HSC top GPA and medical entrance readiness.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-10-29T11:00:00Z'),
    },
    {
      title: 'A-Level Chemistry: Physical, Inorganic & Organic Units',
      subject: 'Chemistry',
      classLevel: 'A-Level',
      mode: 'Offline',
      location: 'Gulshan, Dhaka',
      monthlyFee: 7000,
      daysPerWeek: '2 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80',
      description: 'Edexcel and Cambridge CAIE syllabus past papers solving, practical paper tips, and structured numerical practice for guaranteed A* results.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-10-27T16:00:00Z'),
    },
    {
      title: 'O-Level English Literature & Essay Composition Bootcamp',
      subject: 'English',
      classLevel: 'O-Level',
      mode: 'Online',
      location: 'Online',
      monthlyFee: 2800,
      daysPerWeek: '2 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
      description: 'Prose analysis, poetry interpretation, essay structuring, and vocabulary mastery following Cambridge O-Level benchmarks.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-10-31T09:00:00Z'),
    },
    {
      title: 'Complete HSC Physics: Concept Clearing & Mathematical Problem Solving',
      subject: 'Physics',
      classLevel: 'HSC',
      mode: 'Online',
      location: 'Online (Zoom & Canvas)',
      monthlyFee: 3500,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
      description: 'Master Newton mechanics, thermodynamics, wave optics, electricity, and modern physics with problem-solving from top engineering admission tests.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-01T14:00:00Z'),
    },
    {
      title: 'Python Mastery: From Fundamentals to Data Structures & Algorithms',
      subject: 'Programming',
      classLevel: 'Class 9-10',
      mode: 'Online',
      location: 'Online (GitHub & Replit)',
      monthlyFee: 4200,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
      description: 'Introduction to algorithmic problem solving, logic building, recursion, data structures, and competitive programming for school and college coders.',
      tutorName: 'Rafiq Hasan',
      tutorEmail: 'rafiq.tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-07T12:00:00Z'),
    },
    {
      title: 'Creative Writing, Storytelling & Critical Thinking Lab',
      subject: 'English',
      classLevel: 'Class 9-10',
      mode: 'Offline',
      location: 'Mirpur, Dhaka',
      monthlyFee: 2200,
      daysPerWeek: '2 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
      description: 'Interactive creative writing workshop designed to cultivate narrative flow, rhetoric, vocabulary building, and speech confidence.',
      tutorName: 'Rafiq Hasan',
      tutorEmail: 'rafiq.tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-10T17:00:00Z'),
    },
    {
      title: 'University Financial Accounting & Managerial Analytics',
      subject: 'Business Studies',
      classLevel: 'University',
      mode: 'Offline',
      location: 'Mirpur, Dhaka',
      monthlyFee: 4800,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      description: 'BBA & MBA mentorship for financial statement analysis, cost volume profit analysis, capital budgeting, and Excel financial modeling.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'approved',
      isActive: true,
      createdAt: new Date('2026-11-02T13:00:00Z'),
    },
    {
      title: 'IGCSE Mathematics: Pure Maths & Mechanics Fast-Track',
      subject: 'Mathematics',
      classLevel: 'O-Level',
      mode: 'Online',
      location: 'Online',
      monthlyFee: 4000,
      daysPerWeek: '3 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1200&q=80',
      description: 'Comprehensive syllabus completion and past paper drilling for Cambridge 0580 and Edexcel 4MA1 curricula.',
      tutorName: 'Karim Rahman',
      tutorEmail: 'tutor@mentorlagbe.com',
      approvalStatus: 'pending', // Pending Admin moderation test item
      isActive: true,
      createdAt: new Date('2026-11-15T10:00:00Z'),
    },
    {
      title: 'Robotics & Arduino IoT Workshop for Young Innovators',
      subject: 'Programming',
      classLevel: 'Class 9-10',
      mode: 'Offline',
      location: 'Bashundhara R/A, Dhaka',
      monthlyFee: 4500,
      daysPerWeek: '2 days / week',
      bannerImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      description: 'Hands-on hardware programming with Arduino, ESP32, sensors, actuators, and smart home IoT projects.',
      tutorName: 'Rafiq Hasan',
      tutorEmail: 'rafiq.tutor@mentorlagbe.com',
      approvalStatus: 'pending', // Another pending moderation item
      isActive: true,
      createdAt: new Date('2026-11-16T15:00:00Z'),
    },
  ];

  const tuitionInsertResult = await tuitionsCollection.insertMany(tuitions);
  console.log(`✅ Seeded ${tuitions.length} tuitions.`);

  const insertedTuitionIds = Object.values(tuitionInsertResult.insertedIds);

  // 3. Seed Applications (Connecting students with tuitions)
  const applications = [
    {
      tuitionId: insertedTuitionIds[0].toString(),
      tuitionTitle: tuitions[0].title,
      subject: tuitions[0].subject,
      monthlyFee: tuitions[0].monthlyFee,
      tutorEmail: tuitions[0].tutorEmail,
      studentName: 'Nusrat Jahan',
      studentEmail: 'student@mentorlagbe.com',
      studentPhone: '+880-1700-000004',
      preferredSchedule: 'Evenings (Mon, Wed, Fri)',
      studentNote: 'Excited to learn machine learning models and apply them to my final year thesis.',
      status: 'accepted',
      appliedAt: new Date('2026-11-10T11:00:00Z'),
    },
    {
      tuitionId: insertedTuitionIds[1].toString(),
      tuitionTitle: tuitions[1].title,
      subject: tuitions[1].subject,
      monthlyFee: tuitions[1].monthlyFee,
      tutorEmail: tuitions[1].tutorEmail,
      studentName: 'Nusrat Jahan',
      studentEmail: 'student@mentorlagbe.com',
      studentPhone: '+880-1700-000004',
      preferredSchedule: 'Weekends (Sat & Sun mornings)',
      studentNote: 'Looking to solidify my Next.js App Router and authentication workflows.',
      status: 'pending',
      appliedAt: new Date('2026-11-12T14:30:00Z'),
    },
    {
      tuitionId: insertedTuitionIds[2].toString(),
      tuitionTitle: tuitions[2].title,
      subject: tuitions[2].subject,
      monthlyFee: tuitions[2].monthlyFee,
      tutorEmail: tuitions[2].tutorEmail,
      studentName: 'Tanvir Hossain',
      studentEmail: 'tanvir@student.com',
      studentPhone: '+880-1700-000006',
      preferredSchedule: 'Tuesday & Thursday evenings',
      studentNote: 'Need conceptual help in Differential Equations before semester finals.',
      status: 'pending',
      appliedAt: new Date('2026-11-13T09:15:00Z'),
    },
    {
      tuitionId: insertedTuitionIds[3].toString(),
      tuitionTitle: tuitions[3].title,
      subject: tuitions[3].subject,
      monthlyFee: tuitions[3].monthlyFee,
      tutorEmail: tuitions[3].tutorEmail,
      studentName: 'Anika Rahman',
      studentEmail: 'anika@student.com',
      studentPhone: '+880-1700-000005',
      preferredSchedule: 'Flexible schedule',
      studentNote: 'Preparing for medical admission test, need thorough organic reaction mechanisms.',
      status: 'accepted',
      appliedAt: new Date('2026-11-11T16:00:00Z'),
    },
  ];

  await applicationsCollection.insertMany(applications);
  console.log(`✅ Seeded ${applications.length} applications.`);

  // 4. Seed Payments (Stripe transaction records)
  const payments = [
    {
      userEmail: 'tutor@mentorlagbe.com',
      userName: 'Karim Rahman',
      userRole: 'tutor',
      planName: 'Pro Tutor Plan',
      amount: 15,
      currency: 'usd',
      transactionId: 'txn_stripe_demo_9823412',
      stripeSessionId: 'cs_test_pro_tutor_9823412',
      paymentStatus: 'paid',
      paidAt: new Date('2026-10-06T14:20:00Z'),
    },
    {
      userEmail: 'anika@student.com',
      userName: 'Anika Rahman',
      userRole: 'student',
      planName: 'Pro Student Plan',
      amount: 10,
      currency: 'usd',
      transactionId: 'txn_stripe_demo_5541298',
      stripeSessionId: 'cs_test_pro_student_5541298',
      paymentStatus: 'paid',
      paidAt: new Date('2026-10-16T18:45:00Z'),
    },
    {
      userEmail: 'admin@mentorlagbe.com',
      userName: 'Platform Admin',
      userRole: 'admin',
      planName: 'Pro Enterprise Plan',
      amount: 45,
      currency: 'usd',
      transactionId: 'txn_stripe_demo_1122334',
      stripeSessionId: 'cs_test_pro_admin_1122334',
      paymentStatus: 'paid',
      paidAt: new Date('2026-10-02T10:00:00Z'),
    },
  ];

  await paymentsCollection.insertMany(payments);
  console.log(`✅ Seeded ${payments.length} payment records.`);

  console.log('🎉 Database seeding completed successfully!');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
