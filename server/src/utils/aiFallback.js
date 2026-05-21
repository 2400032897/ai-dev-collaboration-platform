/**
 * DevCollab AI Fallback Generator
 * Provides intelligent, high-quality local mock responses when the Claude API key
 * is dummy, missing, or throws an authentication error.
 */

function reviewCodeFallback(code, language) {
  const normalizedCode = code.toLowerCase();
  
  let score = 8;
  let summary = "Good structure and clean logic with standard syntax.";
  const bugs = [];
  const performance = [];
  const readability = [];
  const security = [];
  let improved_snippet = "";

  // 1. Off-by-one error detection
  if (normalizedCode.includes('<=') && (normalizedCode.includes('.length') || normalizedCode.includes('.size') || normalizedCode.includes('length'))) {
    score = Math.min(score, 6);
    summary = "Functional code, but contains a dangerous off-by-one error in loop condition.";
    bugs.push("Off-by-one bug in loop condition. Using '<=' with length accesses index out of bounds.");
    performance.push("Prevent unnecessary undefined checks by fixing the loop condition bounds.");
    
    // Attempt to rewrite code to fix this
    improved_snippet = code.replace(/<=\s*([a-zA-Z0-9_.]+)\.length/g, '< $1.length');
    improved_snippet = improved_snippet.replace(/<=\s*([a-zA-Z0-9_.]+)\.size/g, '< $1.size');
  }

  // 2. Strict equality checks
  if (normalizedCode.includes('==') && !normalizedCode.includes('===')) {
    score = Math.min(score, 7);
    if (summary === "Good structure and clean logic with standard syntax.") {
      summary = "Code is readable but relies on loose comparison operators.";
    }
    readability.push("Use strict equality '===' instead of loose equality '==' to prevent coercion bugs.");
  }

  // 3. Block scoping (var vs let/const)
  if (normalizedCode.includes('var ')) {
    score = Math.min(score, 7);
    readability.push("Prefer block-scoped 'let' or 'const' over 'var' to prevent variable hoisting issues.");
  }

  // 4. Time complexity & nested loops
  const loopCount = (code.match(/for\s*\(/g) || []).length + (code.match(/while\s*\(/g) || []).length;
  if (loopCount > 1) {
    score = Math.min(score, 6);
    summary = "Nested iteration detected which increases algorithmic complexity.";
    performance.push("O(N^2) time complexity detected. Consider hash maps or sets to reduce search time.");
  }

  // 5. Security (concatenation in SQL or innerHTML)
  if (normalizedCode.includes('select ') && normalizedCode.includes('where ') && normalizedCode.includes('+')) {
    score = Math.min(score, 4);
    summary = "Critical security vulnerability: Potential SQL injection detected.";
    security.push("Prevent SQL injection by using parameterized queries instead of string concatenation.");
  } else if (normalizedCode.includes('innerhtml') && normalizedCode.includes('+')) {
    score = Math.min(score, 5);
    summary = "Potential Cross-Site Scripting (XSS) vulnerability detected.";
    security.push("Avoid direct string concatenation in innerHTML. Use textContent or DOMPurify.");
  }

  // 6. Custom smart improved snippet if not already generated
  if (!improved_snippet) {
    const lang = (language || 'javascript').toLowerCase();
    if ((lang === 'javascript' || lang === 'typescript') && code.includes('function sum')) {
      improved_snippet = `function sum(arr) {\n  return arr.reduce((total, val) => total + val, 0);\n}`;
    }
  }

  // Standard falls
  if (bugs.length === 0) bugs.push("None detected.");
  if (performance.length === 0) performance.push("Consider caching array length in loops for micro-optimization.");
  if (readability.length === 0) readability.push("Add brief JSDoc comments to document function parameters.");
  if (security.length === 0) security.push("No immediate security issues detected.");

  return {
    score,
    summary,
    bugs,
    performance,
    readability,
    security,
    improved_snippet: improved_snippet || code
  };
}

function generateStandupFallback(taskList) {
  const lines = taskList.split('\n');
  const done = [];
  const inprogress = [];
  const inreview = [];
  const todo = [];

  lines.forEach(line => {
    if (line.includes('[DONE]')) done.push(line.replace('[DONE]', '').trim());
    else if (line.includes('[INPROGRESS]')) inprogress.push(line.replace('[INPROGRESS]', '').trim());
    else if (line.includes('[INREVIEW]')) inreview.push(line.replace('[INREVIEW]', '').trim());
    else if (line.includes('[TODO]')) todo.push(line.replace('[TODO]', '').trim());
  });

  let report = "DONE\n";
  if (done.length > 0) {
    done.forEach(t => { report += `- Finished: ${t}\n`; });
  } else {
    report += "- No tasks completed in the last 24 hours.\n";
  }

  report += "\nIN PROGRESS\n";
  if (inprogress.length > 0) {
    inprogress.forEach(t => { report += `- Actively working on: ${t}\n`; });
  } else {
    report += "- No tasks currently in progress.\n";
  }

  report += "\nIN REVIEW / BLOCKERS\n";
  if (inreview.length > 0) {
    inreview.forEach(t => { report += `- Code review pending: ${t}\n`; });
  } else {
    report += "- No blockers or reviews pending.\n";
  }

  report += "\nTODO NEXT\n";
  if (todo.length > 0) {
    todo.slice(0, 3).forEach(t => { report += `- Up next: ${t}\n`; });
  } else {
    report += "- Sprint backlog empty.\n";
  }

  return report;
}

function breakdownFeatureFallback(featureDescription) {
  const desc = featureDescription.toLowerCase();
  
  if (desc.includes('auth') || desc.includes('login') || desc.includes('signup') || desc.includes('user')) {
    return [
      {
        title: "Design User Schema & DB Migrations",
        description: "Define the SQL schema for users, passwords, sessions, and roles. Run migrations.",
        priority: "P0",
        estimatedHours: 4
      },
      {
        title: "Build JWT Auth API Endpoints",
        description: "Implement secure registration, bcrypt password hashing, login, and authorization middleware.",
        priority: "P0",
        estimatedHours: 6
      },
      {
        title: "Create Login & Signup Views",
        description: "Build reactive, accessible forms with proper validation and error styling in frontend.",
        priority: "P1",
        estimatedHours: 8
      },
      {
        title: "Set up client state persistence",
        description: "Store JWT token in localStorage/cookies and implement private route guards in React.",
        priority: "P1",
        estimatedHours: 4
      }
    ];
  }

  if (desc.includes('chat') || desc.includes('message') || desc.includes('realtime') || desc.includes('socket')) {
    return [
      {
        title: "Set up WebSockets Connection Gateway",
        description: "Configure Socket.IO on backend and build client-side listener context manager.",
        priority: "P0",
        estimatedHours: 5
      },
      {
        title: "Design Database Schemas for Messages",
        description: "Create models for chat rooms, active users, and historical message logging.",
        priority: "P0",
        estimatedHours: 4
      },
      {
        title: "Build Responsive Chat Room Interface",
        description: "Create an attractive, scroll-locked message window, sidebar lists, and input form.",
        priority: "P1",
        estimatedHours: 8
      },
      {
        title: "Add typing indicators and presence",
        description: "Emit events on focus/blur and broadcast online status changes in real-time.",
        priority: "P2",
        estimatedHours: 6
      }
    ];
  }

  if (desc.includes('payment') || desc.includes('stripe') || desc.includes('billing') || desc.includes('checkout')) {
    return [
      {
        title: "Integrate Stripe Payment Gateway SDK",
        description: "Configure Stripe secrets in dotenv and set up checkout session APIs.",
        priority: "P0",
        estimatedHours: 6
      },
      {
        title: "Create Checkout Endpoint API",
        description: "Build routes to initiate pricing plans and redirect users to payment page.",
        priority: "P0",
        estimatedHours: 4
      },
      {
        title: "Implement Stripe Event Webhooks",
        description: "Verify Stripe signature and handle payment succeeded/failed events to sync user tiers.",
        priority: "P1",
        estimatedHours: 6
      },
      {
        title: "Build Premium Subscription UI Dashboard",
        description: "Create visual plans grid, invoice list, and subscription cancel/upgrade options.",
        priority: "P1",
        estimatedHours: 8
      }
    ];
  }

  // Default fallback breakdown
  return [
    {
      title: "Analyze Requirements & Schema Architecture",
      description: "Map data relations, design entity models, and document API boundaries.",
      priority: "P0",
      estimatedHours: 3
    },
    {
      title: "Develop Backend REST Controller Methods",
      description: "Implement standard CRUD routes, input validation schemas, and database transactions.",
      priority: "P0",
      estimatedHours: 6
    },
    {
      title: "Build Responsive Interface Components",
      description: "Code the layout views, form inputs, dynamic listings, and loading states.",
      priority: "P1",
      estimatedHours: 7
    },
    {
      title: "Wire Integration & Write Integration Tests",
      description: "Connect client pages to APIs, handle loader spinners, and run robust unit tests.",
      priority: "P1",
      estimatedHours: 4
    }
  ];
}

function projectSummaryFallback(taskData) {
  // Parse numbers out of taskData text
  const totalMatch = taskData.match(/Total:\s*(\d+)/);
  const doneMatch = taskData.match(/Done:\s*(\d+)/);
  const progressMatch = taskData.match(/In Progress:\s*(\d+)/);
  const reviewMatch = taskData.match(/In Review:\s*(\d+)/);
  const todoMatch = taskData.match(/Todo:\s*(\d+)/);
  const stuckMatch = taskData.match(/stuck \([^\)]+\):\s*([^\n]+)/);

  const total = totalMatch ? parseInt(totalMatch[1]) : 0;
  const done = doneMatch ? parseInt(doneMatch[1]) : 0;
  const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
  const review = reviewMatch ? parseInt(reviewMatch[1]) : 0;
  const todo = todoMatch ? parseInt(todoMatch[1]) : 0;
  const stuckText = stuckMatch ? stuckMatch[1].trim() : 'None';

  let stuckInfo = "No blockers or stuck tasks detected.";
  if (stuckText && stuckText !== 'None') {
    stuckInfo = `Some critical items are stuck in progress (>48h): ${stuckText}.`;
  }

  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;

  return `Overall Progress: The project is currently at ${donePercent}% completion with ${done} of ${total} tasks finished. There are ${progress} tasks in active development and ${review} in review.

What is going well: Core development is progressing steadily. We have locked in ${done} key features, and team communication is solid.

Potential Blockers: ${stuckInfo}

Recommended next actions: Let's review the pending code reviews (${review} task${review === 1 ? '' : 's'}) to clear the queue, and re-assign any stuck issues to ensure full velocity.`;
}

module.exports = {
  reviewCodeFallback,
  generateStandupFallback,
  breakdownFeatureFallback,
  projectSummaryFallback
};
