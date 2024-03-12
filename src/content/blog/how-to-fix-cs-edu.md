---
title: how to fix higher-level cs education
description: my two cents on how to improve higher-level cs education
pubDate: 'Mar 12 2024'
---

i shall start with a disclaimer that this poast comes from my experience with my undergraduate study in a university in the UK. my experience is not universal, and therefore i cannot speak for everyone.

at the time of writing, i am about to complete my last year of a 4-year computer science course, including one year of an "industrial placement" which offered me the chance to work as a full-time software engineer in an organization.

here is everything wrong with higher-level cs education, and how to fix it.

## quick summary of my experience

the course offered me a wide range of computer-science-related topics organized as "modules", or "classes" in north-america term. each class is graded the same way - assignments that i had to complete, and then an exam that i had to do at the end. sprinkle in group projects, and it sums up the computer science course.

## pick the right intro programming language

the course started off with an intro programming class, and python was the language of choice. using python as the intro programming language may not shock anyone, but at the university level, it is no longer suitable.

python is a dynamically-typed, GC-ed, scripting language. it abstracts away foundational concepts of programming away, such as data types, memory management, and memory manipulation. without learning the foundational concepts, the students will not grasp programming. they don't know the associated cost of different code operations; nor the idea of constants or variables; nor the idea of type casting; nor the idea of a stack or a heap; nor the idea of pointers. python conditions students to develop bad habits and produce slow and inefficient software.

like how university math courses begin with foundational math classes such as calculus or linear algebra, both of which are not beginner-friendly, a university-level computer science course should not start with an easy programming language. instead, it should start with a programming language that teaches the person foundational concepts of programming, because later topics will build upon these concepts, without which will be much harder to navigate. the course should assume basic understanding of computer operations and programming primitives such as control flows, like how math courses assume understanding of basic algebra.

a good intro programming language would be c. c has a simple syntax, is ubiquitous, and is a useful skill to have. it requires explicit memory management and is statically-typed. the programmer needs to have an excellent grasp of foundational programming concepts to write effective c. with a strong understanding of c, learning other languages will be much easier and straightforward, and students will appreciate how much work are done under the hood of a high level programming language.

## less lectures; more practical

for topics that are of a more theoretical nature, traditional lectures are perfectly fine. for the more hands-on topics, for example programming, however, non-interactive lectures are inadequate. as an example, in my course, there are optional workshops to supplement the lecture sessions. in my opinion, the lecture sessions are unnecessary. knowledge retention will  always increase when coupled with practical experience. lectures are cheap and effective for the university, but ineffective for the students. given how much students pay for their education, an expectation of a high quality experience in return is perfectly reasonable. otherwise, students are better off watching online tutorial videos on their own accord (which is already needed for many students as supplements to the lackluster lectures offered by the uni.)

instead of making hundreds of students sit in silent in a lecture hall, divide the class into smaller groups. each group is assigned different schedules of practical sessions. replace data structure and algorithm lectures with practical sessions in which students follow the instructor and implement the data structure or algorithm introduced in that session. replace programming lectures with practical programming sessions in which students get to use programming constructs immediately as they are introduced by the lecturer. furthermore, a smaller group means students are more willing to ask questions which many are too shy of doing in a lecture hall.

## course structure & assessment

i hate exams. it is utterly ridiculous that the university is making students do pen-and-paper exams for a computer science course. hand-writing code does not make one a better software engineer. asking one to regurgitate definitions of technical jargon does not make one a better software engineer. no real-world projects demand people to recite definitions on a piece of paper, or to write code by hand. exams condition students to study _for_ them rather than for the sake of learning. ask any student if they remember anything after the exams, and their likely answer will be no. exams don't facilitate learning; practical projects do. as a self-taught dev, i learned 99% of computer science through personal projects, not from uni.

assessments should be practical in nature. the university should rid of exams from the course and reduce it to ash with a high power incinerator. practical assignments, while better than exams, should not be the exclusive way to assess a student. in my course, every student is required to complete a final-year project during their final year of study. they can either choose from a bucket list of topics, or come up with their own (i chose the latter, and created [poly](https://polygui.org).) i think it is a fantastic way of assessment, albeit tainted by the requirement to write two academic papers for the project, and the fact that it is cramped into the last year of study.

### course project

i propose that the final-year project should be extended to be a course project that lasts throughout the entire course. this gives students plenty of time to work on the project and pivot when the opportunity arises. even though students may not have the knowledge demanded by the project, they can fill in the knowledge gap gradually as the course progresses. the students should be required to properly document the project in the form they prefer, such as technical documentations or more formal academic papers, depending on what suits their project.

doing projects is far more practical and useful than exams. students can choose to solve real-world problems or to contribute to existing code projects. exam, on the other hand, is a waste of effort and energy while contributing nothing to society.

### assignments

there should be an alternative way to assess a student other than mandatory course assignments. for example, a student with a known history of _usefully_ contributing to open-source software  in relevant topics (not fixing typos in READMEs!) should be exempt from having to complete assignments. this incentivizes students to learn more about OSS etiquettes and contribute to them. OSS benefits from having more contributors. it is a win-win situation.

## well this sounds like coding bootcamps

no it doesn't. a higher-level cs education will offer more depth into each topic, while coding bootcamps teach you what you need to get a job. my issue with it is that it is treated as a purely academic subject. cs is both academic and practical, and right now, university cs education leans towards the former while skimping on the latter. too many final-year people i have talked to struggle to use git; or the command line; or understand basic programming concepts; or how to contribute to OSS. the eduction is to be blamed here, not the students, for failing to educate students with basic practical knowledge. i want to tip the balance back to the middle - giving students both the theoretical and practical knowledge to excel in computer science.

## final words

if any educator stumbles across this poast and want to make a change, my DMs are open (links in the footer). thanks for tuning in, and i'll see u in my next poast.