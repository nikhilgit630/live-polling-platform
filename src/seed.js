const bcrypt = require("bcryptjs")
const prisma = require("./config/database")

async function main() {
  console.log("🌱 Starting database seeding...")

  try {
    // Create sample users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: "Alice Johnson",
          email: "alice@example.com",
          passwordHash: await bcrypt.hash("password123", 12),
        },
      }),
      prisma.user.create({
        data: {
          name: "Bob Smith",
          email: "bob@example.com",
          passwordHash: await bcrypt.hash("password123", 12),
        },
      }),
      prisma.user.create({
        data: {
          name: "Charlie Brown",
          email: "charlie@example.com",
          passwordHash: await bcrypt.hash("password123", 12),
        },
      }),
    ])

    console.log(`✅ Created ${users.length} users`)

    // Create sample polls with options
    const poll1 = await prisma.poll.create({
      data: {
        question: "What is your favorite programming language?",
        isPublished: true,
        creatorId: users[0].id,
        options: {
          create: [{ text: "JavaScript" }, { text: "Python" }, { text: "Go" }, { text: "Rust" }],
        },
      },
      include: {
        options: true,
      },
    })

    const poll2 = await prisma.poll.create({
      data: {
        question: "Which framework do you prefer for web development?",
        isPublished: true,
        creatorId: users[1].id,
        options: {
          create: [{ text: "React" }, { text: "Vue.js" }, { text: "Angular" }, { text: "Svelte" }],
        },
      },
      include: {
        options: true,
      },
    })

    const poll3 = await prisma.poll.create({
      data: {
        question: "What is the best database for modern applications?",
        isPublished: false, // Unpublished poll
        creatorId: users[2].id,
        options: {
          create: [{ text: "PostgreSQL" }, { text: "MongoDB" }, { text: "MySQL" }, { text: "Redis" }],
        },
      },
      include: {
        options: true,
      },
    })

    console.log(`✅ Created 3 polls with options`)

    // Create sample votes
    const votes = await Promise.all([
      // Poll 1 votes
      prisma.vote.create({
        data: {
          userId: users[1].id,
          pollOptionId: poll1.options[0].id, // JavaScript
        },
      }),
      prisma.vote.create({
        data: {
          userId: users[2].id,
          pollOptionId: poll1.options[1].id, // Python
        },
      }),

      // Poll 2 votes
      prisma.vote.create({
        data: {
          userId: users[0].id,
          pollOptionId: poll2.options[0].id, // React
        },
      }),
      prisma.vote.create({
        data: {
          userId: users[2].id,
          pollOptionId: poll2.options[0].id, // React
        },
      }),
    ])

    console.log(`✅ Created ${votes.length} votes`)

    // Display summary
    const totalUsers = await prisma.user.count()
    const totalPolls = await prisma.poll.count()
    const totalVotes = await prisma.vote.count()

    console.log("\n📊 Database seeding completed!")
    console.log(`👥 Total users: ${totalUsers}`)
    console.log(`📋 Total polls: ${totalPolls}`)
    console.log(`🗳️  Total votes: ${totalVotes}`)

    console.log("\n🔐 Sample user credentials:")
    console.log("Email: alice@example.com | Password: password123")
    console.log("Email: bob@example.com | Password: password123")
    console.log("Email: charlie@example.com | Password: password123")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
