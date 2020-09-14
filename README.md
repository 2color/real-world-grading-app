# Real-world class grading backend

A real-world class grading application built with Prisma.

The grading application is used to manage enrollment in online classes, tests (as in exams) for classes, and test results.

The goal if this application is to showcase a real-world scenario of an application using Prisma. the following aspects of Prisma
- Data modeling
- CRUD
- Aggregations
- API layer
- Validation
- Testing
- Authentication
- Authorization
- Integration with other APIs
- Deployment

Check out the [associated tutorial](https://www.prisma.io/blog/modern-backend-1-tsjs1ps7kip1/) to learn more about how the backend was built.

## Data model

The development of this project is driven by the database schema (also known as the data model).
The schema is first designed to represent the following concepts:

- **User**: this can be a student or a teacher, or both. The role of the user is determined through their association with a course.
- **Course**: represent a course that can have multiple students/teachers. Each user can be associated with multiple courses either as a student or as a teacher.
- **CourseEnrollment**: 
- **Test**: Each course can have many tests
- **TestResult**: Each Test can have many TestReusults that is associated with a student

These are defined in the [Prisma schema](./prisma/schema.prisma).
The database schema will be created by Prisma Migrate.

## Tech Stack

- Backend:
  - PostgreSQL
  - Node.js
  - Prisma
  - TypeScript
  - Jest
  - Hapi.js

## How to use

Install npm dependencies:

```
npm install
```
