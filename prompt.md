# Implementation Guidelines

## Development Approach
- Proceed one step at a time following the implementation plan
- Complete each step thoroughly before moving to the next
- Maintain high code quality and follow established patterns

## Documentation Requirements
When each step is completed, the LLM MUST perform these exact actions:

### 1. Mark Step as Complete in Plan
- **File**: `.ai/implementation/plan.md`
- **Action**: Change `- [ ] Step X:` to `- [x] Step X: ✅`
- **Details**: Add ✅ checkmarks to the step title and mark all files as completed

### 2. Create Step Log in Correct Location
- **File**: `.ai/step-logs/step-XX-[descriptive-name].md` 
- **Format**: Follow naming pattern like `step-13-analytics-dashboard.md`
- **Location**: Must be in `.ai/step-logs/` directory (NOT in `docs/`)

### 3. Step Log Content Requirements
Include these sections in the step log:
- **Implementation details**: What was built and how
- **Files created/updated**: Complete list with ✅ status indicators
- **Key features implemented**: Detailed feature breakdown
- **Technical architecture**: Code structure and patterns used
- **Integration points**: How it connects to existing systems
- **Quality assurance**: Testing and validation performed
- **Lessons learned**: Key insights, challenges, and solutions
- **Completion summary**: Final status and next steps

### 4. Verification Steps
Before marking a step complete, verify:
- All planned files are implemented and working
- TypeScript compilation passes without errors
- Integration with existing code is functional
- Documentation is complete and in correct location

## File Location Guidelines
- **Step logs**: Always in `.ai/step-logs/step-XX-name.md`
- **Implementation plan**: `.ai/implementation/plan.md`
- **Never put step logs in**: `docs/` or root directory

See `.ai/README.md` for complete documentation overview.
