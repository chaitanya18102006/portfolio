/* Default content. Everything here can be edited from /admin.html
   Placeholder entries (skills, projects, education, ...) are examples: replace them in the admin panel. */
window.DEFAULT_CONTENT = {
  meta: {
    name: "b.krishna chaitanya naidu",
    siteTitle: "b.krishna chaitanya naidu — UI/UX Designer & Web Developer",
    description: "Portfolio of b.krishna chaitanya naidu, a UI/UX designer and web developer who brings ideas to life using design and code.",
    favicon: "",
    ogImage: ""
  },

  theme: {
    accent: "#ff1414",
    accent2: "#ff7a00",
    defaultMode: "dark"
  },

  nav: {
    items: [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Skills", href: "#skills" },
      { label: "Projects", href: "#projects" },
      { label: "Education", href: "#education" },
      { label: "Experience", href: "#experience" },
      { label: "Certifications", href: "#certifications" },
      { label: "Resume", href: "#resume" },
      { label: "Contact", href: "#contact" }
    ]
  },

  hero: {
    logoText: "B.Krishna Chaitanya Naidu",
    tagline: "UI/UX Designer & Web Developer who brings ideas to life using design and code.",
    title1: "UI/UX DESIGNER",
    title2: "& WEB DEVELOPER",
    description: "I design user-friendly, visually appealing, and functional websites and applications. From wireframes to responsive code, I bring digital ideas to life.",
    photo: "assets/profile.webp",
    btn1Text: "Hire Me",
    btn1Link: "#contact",
    btn2Text: "View Projects",
    btn2Link: "#projects",
    btn3Text: "Download CV",
    bgShape: "horizon"
  },

  stats: {
    items: [
      { value: 3, suffix: "", label: "Roles & Internships" },
      { value: 3, suffix: "", label: "Certificates" },
      { value: 8, suffix: ".0", label: "B.Tech CGPA" }
    ]
  },

  about: {
    visible: true,
    emoji: "",
    heading: "About Me",
    paragraphs: [
      "I'm b.krishna chaitanya naidu, a B.Tech Computer Science student from Kakinada with hands-on experience in cybersecurity and full-stack web development. I enjoy turning ideas into secure, polished and user-friendly digital products.",
      "Beyond code, I bring leadership from managing large-scale events, an entrepreneurial mindset and a passion for startup ecosystems and digital social impact."
    ]
  },

  skills: {
    visible: false,
    heading: "Skills",
    subtitle: "Technologies and tools I work with. Set a level of 0 to show a skill as a simple tag instead of a bar.",
    groups: [
      { title: "Programming Languages", icon: "code", items: [
        { name: "HTML5", level: 90 }, { name: "CSS3", level: 88 }, { name: "JavaScript", level: 78 }, { name: "Python", level: 60 }
      ] },
      { title: "Frameworks & Libraries", icon: "layers", items: [
        { name: "React", level: 70 }, { name: "Tailwind CSS", level: 82 }, { name: "Bootstrap", level: 0 }, { name: "GSAP", level: 0 }
      ] },
      { title: "Tools & Technologies", icon: "cpu", items: [
        { name: "Figma", level: 90 }, { name: "Git & GitHub", level: 80 }, { name: "Firebase", level: 65 }, { name: "VS Code", level: 0 }, { name: "Adobe XD", level: 0 }
      ] },
      { title: "Soft Skills", icon: "heart", items: [
        { name: "Communication", level: 0 }, { name: "Problem Solving", level: 0 }, { name: "Creativity", level: 0 }, { name: "Teamwork", level: 0 }, { name: "Time Management", level: 0 }
      ] }
    ]
  },

  projects: {
    visible: true,
    heading: "Projects",
    subtitle: "A few things I've designed and built. Click a card for details, replace these from the admin panel.",
    items: [
      { title: "Project One", tag: "UI/UX · Web", text: "Short description of the project, the problem it solves and the outcome.", image: "", tech: "HTML, CSS, JavaScript, Figma", role: "UI/UX designer & front-end developer", details: "Describe what you built.\nExplain your contributions and decisions.\nMention results, users or learnings.", github: "", demo: "" },
      { title: "Project Two", tag: "App Design", text: "Short description of the project, the problem it solves and the outcome.", image: "", tech: "Figma, Prototyping, User Research", role: "Product designer", details: "Describe what you built.\nExplain your contributions and decisions.", github: "", demo: "" },
      { title: "Project Three", tag: "Web Development", text: "Short description of the project, the problem it solves and the outcome.", image: "", tech: "React, Firebase, Tailwind CSS", role: "Full-stack developer", details: "Describe what you built.\nExplain your contributions and decisions.", github: "", demo: "" }
    ]
  },

  education: {
    visible: true,
    heading: "Education",
    subtitle: "My academic background.",
    items: [
      { degree: "B.Tech (CSE)", school: "GMRIT, Rajam", period: "2028 (Pursuing)", score: "CGPA: 8.0 / 10", text: "", coursework: "" },
      { degree: "Intermediate", school: "Tirumala Junior College, Katheru", period: "2024", score: "97.2% (972/1000)", text: "", coursework: "" },
      { degree: "10th Standard", school: "Sri Chaitanya Techno School, Kakinada", period: "2022", score: "92.5% (555/600)", text: "", coursework: "" }
    ]
  },

  experience: {
    visible: true,
    heading: "Experience",
    subtitle: "Internships and freelance work.",
    items: [
      { role: "Software Trainee Intern (Web Development)", company: "Krify Software Technologies Pvt. Ltd., Kakinada", period: "04 May 2026 – 12 Jun 2026", type: "Internship", text: "Trained in Web Development in the domain of web technologies.\nWorked on a live project under the company's supervision.\nContributed to startup ecosystem development, innovation events, and professional founder networking." },
      { role: "Cybersecurity Intern", company: "Acme Grade", period: "", type: "Internship", text: "Gained practical, hands-on experience in cybersecurity fundamentals, threat landscapes, and core networking principles." },
      { role: "Freelance Technical & Digital Solutions Provider", company: "Independent", period: "", type: "Freelance", text: "Managed end-to-end client communications while independently delivering technical and digital projects tailored to client needs." }
    ]
  },

  certifications: {
    visible: true,
    heading: "Certifications",
    subtitle: "Courses and credentials. Click a certificate to enlarge it.",
    items: [
      { name: "Introduction to Cybersecurity", org: "Cisco Networking Academy", date: "September 2026", note: "Student-level credential", image: "assets/certificates/cisco-introduction-to-cybersecurity.jpg", link: "assets/certificates/cisco-certificate.pdf" },
      { name: "Software Trainee Internship (Web Development)", org: "Krify Software Technologies Pvt. Ltd.", date: "June 2026", note: "04 May – 12 Jun 2026 · Academic internship", image: "assets/certificates/krify-internship.jpg", link: "assets/certificates/krify-internship.pdf" },
      { name: "Mastering the Linux", org: "L&T EduTech", date: "", note: "Course pathway · 7 courses · 38 learning hours", image: "assets/certificates/mastering-the-linux.jpg", link: "assets/certificates/mastering-the-linux.pdf" }
    ]
  },

  achievements: {
    visible: true,
    heading: "Achievements",
    subtitle: "Awards, hackathons, competitions and milestones.",
    items: [
      { title: "Hackathon Participation", category: "Hackathon", date: "YYYY", text: "Describe the event, your team and what you built." },
      { title: "Competition Result", category: "Competition", date: "YYYY", text: "Describe the competition and your result." },
      { title: "Academic / Professional Award", category: "Award", date: "YYYY", text: "Describe the award or milestone." }
    ]
  },

  resume: {
    visible: true,
    heading: "Resume / CV",
    subtitle: "Want the full picture? Grab my resume.",
    pdfUrl: "assets/resume.pdf",
    updated: "November 2026",
    summary: "My education, internships, freelance work and strengths, all on one page.",
    downloadText: "Download Resume"
  },

  technologies: {
    visible: true,
    heading: "Known Technologies",
    speed: "normal",
    groups: [
      { title: "Programming Languages", icon: "code", items: ["JavaScript", "TypeScript", "Python", "Java", "C++", "PHP"] },
      { title: "Frontend", icon: "monitor", items: ["HTML5", "CSS3", "React.js", "Next.js", "Tailwind CSS", "Bootstrap"] },
      { title: "Backend", icon: "terminal", items: ["Node.js", "Express.js", "Django", "FastAPI", "REST API"] },
      { title: "Databases", icon: "layers", items: ["MongoDB", "MySQL", "PostgreSQL", "Firebase", "Supabase"] },
      { title: "Tools & Cloud", icon: "globe", items: ["Git", "GitHub", "VS Code", "Postman", "Docker", "AWS", "Vercel"] },
      { title: "Design", icon: "palette", items: ["Figma", "Canva", "Photoshop", "Framer"] },
      { title: "AI / Machine Learning", icon: "cpu", items: ["Python", "TensorFlow", "PyTorch", "OpenAI API", "Scikit-learn"] }
    ]
  },

  testimonials: {
    visible: false,
    heading: "Testimonials",
    subtitle: "Kind words from clients, teammates and mentors.",
    items: [
      { name: "Client Name", role: "Company / Role", text: "A short, genuine recommendation about working with you.", photo: "" },
      { name: "Teammate Name", role: "Company / Role", text: "A short, genuine recommendation about working with you.", photo: "" }
    ]
  },

  blog: {
    visible: false,
    heading: "Blog & Articles",
    subtitle: "Tutorials, learning notes and personal insights.",
    items: [
      { title: "Article title", tag: "Tutorial", date: "Month YYYY", text: "A one or two line summary of the article.", image: "", link: "" },
      { title: "Another article", tag: "Insights", date: "Month YYYY", text: "A one or two line summary of the article.", image: "", link: "" }
    ]
  },

  contact: {
    visible: true,
    heading: "Let's Design Together",
    text: "Have an idea or a project in mind? Send me a message and I'll get back to you shortly.",
    email: "chaitanyabuddala.2006@gmail.com",
    phone: "+91 8688897191",
    location: "Kakinada, Andhra Pradesh",
    namePlaceholder: "Your Name",
    emailPlaceholder: "Enter Your Email",
    messagePlaceholder: "Tell me about your project...",
    button: "Contact Me",
    success: "Thanks! Your message has been sent. I'll be in touch soon."
  },

  footer: {
    logoText: "B.Krishna Chaitanya Naidu",
    copyright: "© {year} b.krishna chaitanya naidu. All Rights Reserved.",
    socials: [
      { icon: "linkedin", url: "https://www.linkedin.com/in/chaitanya-buddala-18878330b" },
      { icon: "github", url: "https://github.com/chaitanya18102006" },
      { icon: "instagram", url: "https://www.instagram.com/chaitanya18_10" },
      { icon: "twitter", url: "" },
      { icon: "youtube", url: "" }
    ]
  }
};
