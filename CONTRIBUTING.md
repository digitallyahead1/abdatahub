# Contributing to AB Data Hub

We appreciate your interest in contributing! Please follow these guidelines.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ab-data-hub.git`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Commit with clear messages: `git commit -m "Add feature description"`
6. Push to your fork: `git push origin feature/your-feature`
7. Create a Pull Request

## Branch Naming

- Feature: `feature/feature-name`
- Bugfix: `bugfix/bug-name`
- Hotfix: `hotfix/hotfix-name`
- Docs: `docs/documentation-update`

## Commit Messages

Use clear, descriptive messages:

```
type(scope): description

Detailed explanation if needed

Closes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Build, dependencies, etc.

## Code Standards

### TypeScript/JavaScript

```typescript
// Use const/let, not var
// Proper types for all functions
// No `any` without justification
// Use arrow functions where appropriate
```

### Formatting

Run before committing:

```bash
# Frontend
cd frontend && npm run lint:fix

# Backend
cd backend && npm run lint:fix
```

## Testing

- Add tests for new features
- Ensure all tests pass: `npm run test`
- Coverage should be maintained

## Documentation

- Update README if needed
- Document new APIs
- Add JSDoc comments to functions

## Pull Request Process

1. Ensure tests pass
2. Update documentation
3. Provide clear PR description
4. Reference related issues
5. Request review from maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on ideas, not individuals

## Questions?

Create an issue or contact the team.

---

Thank you for contributing!
