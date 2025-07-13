# Implementation Guidelines

## Development Approach
- Proceed one step at a time following the implementation plan
- Complete each step thoroughly before moving to the next
- Maintain high code quality and follow established patterns

## Documentation Requirements
When each step is completed:

1. **Mark it done** in the progress tracker
2. **Create a step log** in `.ai/step-logs/step-XX-name.md` containing:
   - **Implementation details**: What was built and how
   - **Lessons learned**: Key insights, challenges, and solutions
   - **Todo items**: Follow-up tasks and improvements needed
   - **Code references**: Important files and functions created

## .ai Folder Structure
The project uses an organized documentation system in `.ai/`:

- **`implementation/`** - Overall planning and progress tracking
  - `plan.md` - Comprehensive 20-step implementation plan
  - `progress.md` - Current status and milestone tracking
  
- **`step-logs/`** - Detailed logs for each completed step
  - `step-01-project-setup.md` - Foundation setup details
  - `step-02-design-system.md` - UI component implementation
  - `step-03-database-schema.md` - Database and schema setup
  - `step-04-database-access-layer.md` - Server actions and data layer
  - `step-05-clerk-authentication.md` - Authentication integration
  - `step-06-user-preferences.md` - User profile and preferences
  - `step-07-timer-implementation.md` - Core timer engine
  - `step-08-session-persistence.md` - Session management and persistence
  
- **`architecture/`** - Technical decisions and system design
  - `decisions.md` - Architecture Decision Records (ADRs)
  - `tech-stack.md` - Technology choices and rationale
  
- **`features/`** - Feature specifications and requirements
- **`workflows/`** - Development processes and guidelines
- **`prompts/`** - AI interaction patterns and troubleshooting

## Current Status
- **Progress**: 8/20 steps completed (40%)
- **Next**: Step 9 - Project Creation and Management
- **Focus**: Session management system is complete, moving to project management features

See `.ai/README.md` for complete documentation overview.
