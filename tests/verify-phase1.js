/**
 * Phase 1 Verification Script
 * Validates models, schema constraints, connection utility, and health check handler.
 */

import { getConnectionStatus } from '../lib/mongodb.js';
import User from '../backend/models/User.js';
import Player from '../backend/models/Player.js';
import Session from '../backend/models/Session.js';
import Match from '../backend/models/Match.js';
import { GET as healthCheckHandler } from '../app/api/health/route.js';

async function runPhase1Tests() {
  console.log('🧪 Starting Phase 1 Verification Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // Test 1: User Schema
  try {
    const user = new User({
      name: 'Coach Carter',
      email: 'carter@academy.com',
      password: 'password123',
      role: 'coach',
    });
    const validationError = user.validateSync();
    assert(!validationError, 'User model validates valid coach user');

    const invalidRoleUser = new User({
      name: 'Bad Role',
      email: 'bad@test.com',
      password: 'pass',
      role: 'invalid_role',
    });
    const roleError = invalidRoleUser.validateSync();
    assert(!!roleError?.errors?.role, 'User model rejects invalid role enum');
  } catch (err) {
    assert(false, `User model error: ${err.message}`);
  }

  // Test 2: Player Schema
  try {
    const player = new Player({
      name: 'Alex Hunter',
      age: 18,
      sport: 'football',
    });
    const playerError = player.validateSync();
    assert(!playerError, 'Player model validates valid player');

    const invalidAgePlayer = new Player({
      name: 'Baby Player',
      age: 0,
      sport: 'football',
    });
    const ageError = invalidAgePlayer.validateSync();
    assert(!!ageError?.errors?.age, 'Player model rejects age < 1');
  } catch (err) {
    assert(false, `Player model error: ${err.message}`);
  }

  // Test 3: Session Schema
  try {
    const session = new Session({
      date: new Date(),
      sport: 'basketball',
      status: 'open',
      attendance: [],
    });
    const sessionError = session.validateSync();
    assert(!sessionError, 'Session model validates open practice session');

    const invalidSession = new Session({
      date: new Date(),
      sport: 'basketball',
      status: 'archived', // Not in enum
    });
    const statusError = invalidSession.validateSync();
    assert(!!statusError?.errors?.status, 'Session model rejects invalid status');
  } catch (err) {
    assert(false, `Session model error: ${err.message}`);
  }

  // Test 4: Match Schema
  try {
    const match = new Match({
      date: new Date(),
      sport: 'tennis',
      opponent: 'Elite Tennis Club',
      participatingPlayers: [],
    });
    const matchError = match.validateSync();
    assert(!matchError, 'Match model validates valid match structure');

    const invalidMatch = new Match({
      sport: 'tennis', // Missing date and opponent
    });
    const matchRequiredError = invalidMatch.validateSync();
    assert(
      !!matchRequiredError?.errors?.date && !!matchRequiredError?.errors?.opponent,
      'Match model enforces required date and opponent'
    );
  } catch (err) {
    assert(false, `Match model error: ${err.message}`);
  }

  // Test 5: Health Check Handler Execution
  try {
    const response = await healthCheckHandler();
    const body = await response.json();
    assert(
      typeof body.success === 'boolean' && typeof body.message === 'string',
      'GET /api/health returns valid API response structure'
    );
    assert(
      ['connected', 'disconnected', 'connecting', 'unknown'].includes(body.data?.database),
      `GET /api/health returns expected database state (${body.data?.database})`
    );
  } catch (err) {
    assert(false, `Health check execution error: ${err.message}`);
  }

  console.log(`\n📊 Test Summary: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('🎉 Phase 1 Backend Verification: ALL CHECKS PASSED!\n');
  } else {
    process.exit(1);
  }
}

runPhase1Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

