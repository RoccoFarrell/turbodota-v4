# Card Battler Documentation Structure

This document explains the organization of the `docs/card-battler/` folder.

## Organization Philosophy

- **Planning documents** (created before development) remain in the root folder
- **Phase-specific documents** (created during development) are organized in phase folders
- This keeps planning accessible while organizing development progress by phase

## Folder Structure

```
docs/card-battler/
├── README.md                          # Main overview and quick links
├── PLANNING.md                        # Complete feature specification
├── DEVELOPMENT_ROADMAP.md             # Incremental development strategy
├── TESTING_STRATEGY.md                # Comprehensive testing approach
├── BATTLE_MECHANICS.md                # Battle system details
├── HERO_SPECIFICS.md                  # All 127 hero card designs
├── CARD_EXAMPLES.md                   # Example card designs
├── PRE_DEVELOPMENT_QUESTIONS.md       # Design questions and resolutions
├── DECISIONS_SUMMARY.md               # Quick reference for decisions
├── DETERMINISTIC_BATTLES.md           # Deterministic battle strategies
├── CONCURRENT_BATTLE_ACTIONS.md       # Concurrent action scenarios
│
├── PROGRESS.md                        # Milestone tracking (all phases - updated throughout)
│
└── phase-0/                           # Phase 0: Foundation & Setup
    ├── README.md                      # Phase 0 overview
    ├── PHASE_0_COMPLETE.md            # Phase 0 completion summary
    ├── PHASE_0_SUMMARY.md             # Phase 0 progress summary
    ├── PRISMA_MIGRATION_RESET.md      # Migration reset guide
    └── SAFE_MIGRATION_RESET.md        # Safe migration approach
```

## Document Categories

### Root Folder Documents
- **README.md** - Feature overview and quick links to all documents
- **PROGRESS.md** - Milestone tracking (updated throughout all phases)
- **DOCUMENTATION_STRUCTURE.md** - This file - explains the organization

### Planning Documents (planning/)
Created during planning phase, before any code changes:

- **PLANNING.md** - Complete feature specification
- **DEVELOPMENT_ROADMAP.md** - Development strategy
- **TESTING_STRATEGY.md** - Testing approach
- **BATTLE_MECHANICS.md** - Battle system design
- **HERO_SPECIFICS.md** - Card designs
- **CARD_EXAMPLES.md** - Example cards
- **PRE_DEVELOPMENT_QUESTIONS.md** - Q&A
- **DECISIONS_SUMMARY.md** - Decision reference
- **DETERMINISTIC_BATTLES.md** - Battle strategies
- **CONCURRENT_BATTLE_ACTIONS.md** - Action scenarios

### Root Folder Documents
- **README.md** - Main overview and quick links
- **PROGRESS.md** - Tracks all milestones across all phases (updated continuously)
- **DOCUMENTATION_STRUCTURE.md** - Explains the documentation organization

### Phase 0 Documents (phase-0/)
Created during Phase 0: Foundation & Setup:

- **PHASE_0_COMPLETE.md** - Phase 0 completion verification
- **PHASE_0_SUMMARY.md** - Phase 0 progress summary
- **PRISMA_MIGRATION_RESET.md** - Migration reset guide
- **SAFE_MIGRATION_RESET.md** - Safe migration approach

### Future Phase Folders

As development progresses, additional phase folders will be created:

- `phase-1/` - Core Data Models & Utilities
- `phase-2/` - Database & Data Layer
- `phase-3/` - Business Logic Layer
- `phase-4/` - API Layer
- `phase-5/` - UI Components
- `phase-6/` - Pages & Routes
- `phase-7/` - Integration & Polish

## Quick Reference

**Start Here**: [README.md](./README.md) - Overview and quick links

**Planning**: All planning documents in [planning/](./planning/) folder

**Progress**: [PROGRESS.md](./PROGRESS.md) - Milestone tracking (all phases)

**Current Phase**: Phase 0 ✅ COMPLETE

**Next Phase**: Phase 1.1 - Enums & Types
