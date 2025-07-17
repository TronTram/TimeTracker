Act as Git expert and senior software engineer, I need your assistance to craft focused Git commits based on my current unstaged changes.

**Important**: Only include related files in one commit. If changes span multiple features or concerns, we should commit multiple times with logical groupings.

Carefully analyze the provided Git diff output:

<git-diff>
  use git diff
</git-diff>

First, analyze if the changes should be split into multiple commits by identifying distinct logical groups (e.g., bug fixes, new features, documentation, refactoring, etc.).

Then, for each logical group, provide the following outputs:

### For Each Logical Group:

#### 1. Professional Git Commit Message

Craft a concise, clear, and descriptive Git commit message adhering to professional standards. Your commit message must:

* Clearly state **what changes** were made.
* Briefly explain **why these changes** were made (their purpose).
* Mention explicitly **what issue they resolve or new functionality they introduce**.
* Focus only on the specific logical group of changes.

#### Context for Changes:

[Briefly describe the overall purpose of this specific group of changes, e.g., "These changes fix authentication issues in the user menu component," or "These modifications add the dashboard layout infrastructure."]

#### 2. Impacted File Paths

Provide a bulleted list of file paths (relative to the repository root) directly affected by this specific logical group of changes. Ensure only files directly relevant to this particular concern are included.

#### 3. Staging Command

Provide the exact `git add` command to stage only the files for this specific commit.

---

## Commit Strategy

If multiple logical groups are identified, organize them in order of dependency and logical flow:
1. **Bug fixes** (should go first to resolve immediate issues)
2. **Core functionality** (main features or components)
3. **Supporting features** (additional components that depend on core)
4. **Documentation and configuration** (should go last)

Each commit should be atomic and focused on a single concern or feature area.
Each commit is focused, atomic, and represents a logical unit of functionality that can be reviewed and potentially reverted independently.