import { PrismaClient } from '@prisma/client'
import { add, max } from 'date-fns'

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

// A `main` function so that we can use async/await
async function main() {
  // Seed the database with users and posts
  await prisma.courseEnrollment.deleteMany({})
  await prisma.testResult.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.test.deleteMany({})
  await prisma.course.deleteMany({})

  const weekFromNow = add(new Date(), { days: 7 })
  const twoWeekFromNow = add(new Date(), { days: 14 })
  const monthFromNow = add(new Date(), { days: 28 })

  const course1 = await prisma.course.create({
    data: {
      name: 'Real-world Prisma',
      tests: {
        create: [
          {
            date: weekFromNow,
            name: 'First test',
          },
          {
            date: twoWeekFromNow,
            name: 'Second test',
          },
          {
            date: monthFromNow,
            name: 'Final',
          },
        ],
      },
    },
  })

  const teacher = await prisma.user.create({
    data: {
      email: 'rita@prisma.io',
      name: 'rita',
      social: {
        facebook: 'ritaprisma',
        twitter: 'ritasport',
        myspace: 'oldschoolrita',
      },
      courses: {
        create: {
          course: { connect: { id: course1.id } },
          role: 'TEACHER',
        },
      },
    },
  })

  const students = []

  students.push(
    await prisma.user.create({
      data: {
        email: 'ada@prisma.io',
        name: 'Ada',
        courses: {
          create: {
            course: { connect: { id: course1.id } },
            role: 'STUDENT',
          },
        },
      },
    }),
  )

  students.push(
    await prisma.user.create({
      data: {
        email: 'alvin@prisma.io',
        name: 'Alvin',
        courses: {
          create: {
            course: { connect: { id: course1.id } },
            role: 'STUDENT',
          },
        },
      },
    }),
  )

  students.push(
    await prisma.user.create({
      data: {
        email: 'micky@prisma.io',
        name: 'micky',
        courses: {
          create: {
            course: { connect: { id: course1.id } },
            role: 'STUDENT',
          },
        },
      },
    }),
  )

  const course2 = await prisma.course.create({
    data: {
      name: 'new course',
      members: {
        create: [
          {
            user: { connect: { email: teacher.email } },
            role: 'TEACHER',
          },
          {
            user: { connect: { email: students[0]?.email } },
            role: 'STUDENT',
          },
          {
            user: { connect: { email: students[1]?.email } },
            role: 'STUDENT',
          },
          {
            user: { connect: { email: students[2]?.email } },
            role: 'STUDENT',
          },
        ],
      },
      tests: {
        create: [
          {
            date: weekFromNow,
            name: 'First test',
          },
          {
            date: twoWeekFromNow,
            name: 'Second test',
          },
          {
            date: monthFromNow,
            name: 'Final',
          },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      tests: true,
    },
  })

  const randomResults = [650, 900, 950, 850]

  const results = {}

  for (const test of course2.tests) {
    for (const member of course2.members) {
      if (member.role === 'TEACHER') {
        continue
      }

      await prisma.testResult.create({
        data: {
          result:
            randomResults[Math.floor(Math.random() * randomResults.length)],
          test: {
            connect: { id: test.id },
          },
          student: {
            connect: { id: member.user.id },
          },
          gradedBy: {
            connect: { id: teacher.id },
          },
        },
      })
    }

    const results = await prisma.testResult.aggregate({
      where: {
        testId: test.id,
      },
      avg: { result: true },
      max: { result: true },
      min: { result: true },
      count: true,
    })
    console.log(`testId: ${test.id}`, results)
  }

  const data = await prisma.course.findOne({
    where: { id: course2.id },
    include: {
      tests: {
        include: {
          testResult: {
            include: { student: true },
          },
        },
      },
    },
  })
  console.log(JSON.stringify(data, null, '\t'))
}

main()
  .catch((e: Error) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.disconnect()
  })
