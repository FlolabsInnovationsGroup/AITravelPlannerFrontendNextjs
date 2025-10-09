# Your Project Name

This project is built with Next.js, pnpm, Tailwind CSS, shadcn/ui, and Docker.

#Recommit change
## Table of Contents

1. [Getting Started](#getting-started)
2. [Environment Variables](#environment-variables)
3. [Project Structure](#project-structure)
4. [Development Tools](#development-tools)
5. [Best Practices](#best-practices)
6. [Running Tests](#running-tests)
7. [Deployment](#deployment)
8. [Contributing](#contributing)

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-username/your-project-name.git
   cd your-project-name
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Set up your environment:
   - Copy `.env.example` to `.env.local`
   - Update `.env.local` with your local development values
   - Run `pnpm check-env` to ensure all required variables are set

4. Run the development server:
   ```
   pnpm dev
   ```
   Or using Docker:
   ```
   docker-compose up
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

This project uses environment variables for configuration. The `.env.example` file contains all the required variables with placeholder values. For local development:

1. Copy `.env.example` to `.env.local`
2. Update `.env.local` with your actual values
3. Never commit `.env.local` or any other `.env.*` files (except `.env.example`)

## Project Structure

```
src/
├── app/         # Next.js app router pages
├── components/  # Reusable React components
│   └── ui/      # shadcn/ui components
├── lib/         # Utility functions and shared logic
├── styles/      # Global styles and Tailwind CSS configuration
└── types/       # TypeScript type definitions
```

## Development Tools

- **Next.js**: React framework for building the application
- **pnpm**: Fast, disk space efficient package manager
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Re-usable components built using Radix UI and Tailwind CSS
- **ESLint & Prettier**: Code linting and formatting
- **Husky & lint-staged**: Git hooks for running linters and formatters
- **Jest & React Testing Library**: Testing framework
- **Docker**: Containerization for consistent development and deployment

## Best Practices

- Use TypeScript for type safety
- Follow the Airbnb JavaScript Style Guide
- Write unit tests for components and utility functions
- Use Docker for consistent development and deployment environments
- Use environment variables for configuration
- Follow the Next.js best practices for routing and API development

## Running Tests

To run tests, use the following command:

```
pnpm test
```

To run tests in watch mode:

```
pnpm test:watch
```

## Deployment

(Add specific deployment instructions here, including how to handle environment variables in your production environment)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure you have updated tests as appropriate and all tests are passing before submitting a Pull Request.

---

For any additional questions or issues, please open an issue in the GitHub repository or contact the project maintainers.