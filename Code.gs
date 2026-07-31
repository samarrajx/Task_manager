/**
 * Habit Tracker Backend v3 - Google Apps Script
 * Built for Google Sheets + Google Tasks API + Web App API (GET/POST)
 */

// ==========================================
// 1. MENU & INITIALIZATION
// ==========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Habit Tracker')
    .addItem('Sync Tasks Now', 'syncNow')
    .addItem('Recalculate Streaks & Dashboard', 'recalculateAll')
    .addItem('Run Sync Diagnostics', 'runSyncDiagnostics')
    .addSeparator()
    .addItem('Set Secret Token', 'promptSetSecretToken')
    .addItem('Initialize Sheet Tabs & Headers', 'setupInitialSheet')
    .addItem('Setup 15-Min Auto-Sync Trigger', 'createTimeDrivenTrigger')
    .addToUi();
}

function promptSetSecretToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Set Secret Token',
    'Enter a strong random secret token (32+ characters recommended):',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() == ui.Button.OK) {
    const token = response.getResponseText().trim();
    if (token) {
      setSecretToken(token);
    } else {
      ui.alert('Token cannot be empty. Please generate a strong random token.');
    }
  }
}

function setSecretToken(token) {
  const t = (token || '').trim();
  if (!t) {
    throw new Error('SECRET_TOKEN cannot be empty. Please generate a strong random token (32+ characters).');
  }
  PropertiesService.getScriptProperties().setProperty('SECRET_TOKEN', t);
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    try {
      SpreadsheetApp.getUi().alert('SECRET_TOKEN set successfully in Script Properties!');
    } catch(e){}
  }
  return t;
}

function getSecretToken_() {
  const storedSecret = PropertiesService.getScriptProperties().getProperty('SECRET_TOKEN');
  if (!storedSecret) {
    throw new Error('SECRET_TOKEN missing in Script Properties. Run promptSetSecretToken to set a strong 32+ character random secret token.');
  }
  return storedSecret;
}

function syncNow() {
  fetchAndSyncAllTasks_();
  markStalePendingAsMissed_();
  calculateStreaks_();
  updateDashboard_();
}

function recalculateAll() {
  markStalePendingAsMissed_();
  calculateStreaks_();
  updateDashboard_();
}

function setupInitialSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const tabs = {
    'Config': [
      ['List Name', 'Category'],
      ['My Tasks', 'General'],
      ['--- SETTINGS ---', '--- VALUE ---'],
      ['Timezone', 'Asia/Kolkata'],
      ['Day Cutoff Hour', '4']
    ],
    'DailyTasks': [
      ['Date', 'Google Task ID', 'Task Name', 'Status', 'Completed At', 'Priority', 'Category', 'Is Optional']
    ],
    'Streaks': [
      ['Task', 'Current', 'Best']
    ],
    'Goals': [
      ['Task', 'Period', 'Target', 'Unit']
    ],
    'Notes': [
      ['Date', 'Mood', 'Energy', 'Wins', 'Challenges']
    ],
    'Dashboard': [
      ['Metric', 'Value'],
      ["Today's Completion %", '0%'],
      ["Today's Completed / Total", '0 / 0'],
      ['Overall Current Streak', '0 days'],
      ['Longest Streak (Any Task)', '0 days'],
      ['Missed Today', 'None'],
      ['Last Updated', new Date().toLocaleString()]
    ]
  };

  for (const [tabName, data] of Object.entries(tabs)) {
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
      sheet.getRange(1, 1, 1, data[0].length).setFontWeight('bold');
    }
  }

  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    try {
      SpreadsheetApp.getUi().alert('Habit Tracker tabs initialized successfully!');
    } catch(e){}
  }
}

function createTimeDrivenTrigger() {
  const functionName = 'syncNow';
  const triggers = ScriptApp.getProjectTriggers();
  
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger(functionName)
    .timeBased()
    .everyMinutes(15)
    .create();

  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    try {
      SpreadsheetApp.getUi().alert('15-minute time-driven trigger created successfully!');
    } catch(e){}
  }
}


// ==========================================
// 2. AUTHENTICATION & WEB APP ENDPOINTS
// ==========================================

function checkAuth_(e, payload) {
  try {
    const validSecret = getSecretToken_();
    if (!validSecret) return false;
    const tokenInQuery = e && e.parameter && e.parameter.token;
    const tokenInPayload = payload && payload.token;

    if (tokenInQuery === validSecret || tokenInPayload === validSecret) {
      return true;
    }
    return false;
  } catch (err) {
    Logger.log('Auth check error: ' + err.message);
    return false;
  }
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(message, status) {
  return jsonResponse_({
    success: false,
    error: message || 'unauthorized',
    status: status || 403
  });
}

function doGet(e) {
  let payload = {};
  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
  } catch(err){}

  if (!checkAuth_(e, payload)) {
    return jsonError_('unauthorized', 403);
  }

  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : (payload.action || 'getDashboard');

  try {
    switch(action) {
      case 'getDashboard':
        return jsonResponse_({ success: true, data: handleGetDashboard_() });
      case 'getToday':
        return jsonResponse_({ success: true, data: handleGetToday_() });
      case 'getStreaks':
        return jsonResponse_({ success: true, data: handleGetStreaks_() });
      case 'getStatistics':
        return jsonResponse_({ success: true, data: getStatistics_() });
      case 'getTrends':
        return jsonResponse_({ success: true, data: getTrends_() });
      case 'getCategories':
        return jsonResponse_({ success: true, data: getCategories_() });
      case 'getMissed':
        return jsonResponse_({ success: true, data: getMissed_() });
      case 'getGoals':
        return jsonResponse_({ success: true, data: handleGetGoals_() });
      case 'getNotes':
        return jsonResponse_({ success: true, data: handleGetNotes_() });
      case 'getSettings':
        return jsonResponse_({ success: true, data: handleGetSettings_() });
      case 'getTaskLists':
      case 'getGoogleTasksLists':
        return jsonResponse_({ success: true, data: handleGetGoogleTasksLists_() });
      case 'getBackup':
        return jsonResponse_({ success: true, data: handleGetBackup_() });
      default:
        return jsonError_('Unknown action: ' + action, 400);
    }
  } catch(err) {
    return jsonResponse_({ success: false, error: err.message, status: 500 });
  }
}

function doPost(e) {
  let payload = {};
  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonError_('Invalid JSON payload: ' + err.message, 400);
  }

  if (!checkAuth_(e, payload)) {
    return jsonError_('unauthorized', 403);
  }

  const action = payload.action || (e && e.parameter && e.parameter.action);

  try {
    switch(action) {
      case 'completeTask':
        return jsonResponse_(handleCompleteTask_(payload));
      case 'addNote':
        return jsonResponse_(handleAddNote_(payload));
      case 'setGoal':
        return jsonResponse_(handleSetGoal_(payload));
      case 'updateSettings':
        return jsonResponse_(handleUpdateSettings_(payload));
      case 'restoreBackup':
        return jsonResponse_(handleRestoreBackup_(payload));
      default:
        return jsonError_('Unknown POST action: ' + action, 400);
    }
  } catch(err) {
    return jsonResponse_({ success: false, error: err.message, status: 500 });
  }
}


// ==========================================
// 3. READ-ONLY ANALYTICS FUNCTIONS
// ==========================================

function getStatistics_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DailyTasks');

  const emptyResult = {
    dailyPct: 0,
    weeklyPct: 0,
    monthlyPct: 0,
    totalCompleted: 0,
    totalMissed: 0,
    mostConsistent: 'N/A',
    mostSkipped: 'N/A'
  };

  if (!sheet || sheet.getLastRow() <= 1) return emptyResult;

  const data = sheet.getDataRange().getValues();
  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);
  const todayDateObj = new Date(todayStr);

  let todayComp = 0, todayTot = 0;
  let weekComp = 0, weekTot = 0;
  let monthComp = 0, monthTot = 0;
  let overallCompleted = 0;
  let overallMissed = 0;

  const taskMap = {};

  for (let r = 1; r < data.length; r++) {
    const dStr = formatDateString_(data[r][0], config.timezone);
    const taskName = String(data[r][2] || '').trim();
    const status = String(data[r][3] || '').trim();

    if (!dStr || !taskName) continue;

    if (!taskMap[taskName]) {
      taskMap[taskName] = { dates: new Set(), completedCount: 0, missedCount: 0, totalCount: 0 };
    }

    taskMap[taskName].dates.add(dStr);
    taskMap[taskName].totalCount++;

    if (status === 'Completed') {
      taskMap[taskName].completedCount++;
      overallCompleted++;
    } else if (status === 'Missed') {
      taskMap[taskName].missedCount++;
      overallMissed++;
    }

    const rowDateObj = new Date(dStr);
    const diffDays = Math.round((todayDateObj - rowDateObj) / (1000 * 60 * 60 * 24));

    if (dStr === todayStr) {
      todayTot++;
      if (status === 'Completed') todayComp++;
    }
    if (diffDays >= 0 && diffDays < 7) {
      weekTot++;
      if (status === 'Completed') weekComp++;
    }
    if (diffDays >= 0 && diffDays < 30) {
      monthTot++;
      if (status === 'Completed') monthComp++;
    }
  }

  let mostConsistent = 'N/A', highestRate = -1;
  let mostSkipped = 'N/A', highestMissRate = -1;

  for (const [name, stats] of Object.entries(taskMap)) {
    if (stats.dates.size >= 14) {
      const compRate = stats.totalCount > 0 ? (stats.completedCount / stats.totalCount) : 0;
      const missRate = stats.totalCount > 0 ? (stats.missedCount / stats.totalCount) : 0;

      if (compRate > highestRate) {
        highestRate = compRate;
        mostConsistent = name;
      }
      if (missRate > highestMissRate && stats.missedCount > 0) {
        highestMissRate = missRate;
        mostSkipped = name;
      }
    }
  }

  return {
    dailyPct: todayTot > 0 ? Math.round((todayComp / todayTot) * 100) : 0,
    weeklyPct: weekTot > 0 ? Math.round((weekComp / weekTot) * 100) : 0,
    monthlyPct: monthTot > 0 ? Math.round((monthComp / monthTot) * 100) : 0,
    totalCompleted: overallCompleted,
    totalMissed: overallMissed,
    mostConsistent: mostConsistent,
    mostSkipped: mostSkipped
  };
}

function getTrends_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DailyTasks');

  const emptyResult = {
    weekdayBreakdown: {},
    bestDay: 'N/A',
    worstDay: 'N/A',
    weeklySeries: [],
    monthlySeries: []
  };

  if (!sheet || sheet.getLastRow() <= 1) return emptyResult;

  const data = sheet.getDataRange().getValues();

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayTotals = {
    Mon: { c: 0, t: 0 }, Tue: { c: 0, t: 0 }, Wed: { c: 0, t: 0 },
    Thu: { c: 0, t: 0 }, Fri: { c: 0, t: 0 }, Sat: { c: 0, t: 0 }, Sun: { c: 0, t: 0 }
  };

  const weeklyMap = {};
  const monthlyMap = {};

  for (let r = 1; r < data.length; r++) {
    const dStr = formatDateString_(data[r][0], config.timezone);
    const status = String(data[r][3]).trim();
    if (!dStr) continue;

    const dObj = new Date(dStr);
    const dayName = daysMap[dObj.getDay()];

    if (dayName && weekdayTotals[dayName]) {
      weekdayTotals[dayName].t++;
      if (status === 'Completed') weekdayTotals[dayName].c++;
    }

    const weekStart = new Date(dObj);
    weekStart.setDate(dObj.getDate() - dObj.getDay());
    const weekLabel = formatDateString_(weekStart, config.timezone);
    
    if (!weeklyMap[weekLabel]) {
      weeklyMap[weekLabel] = { weekLabel: 'Week of ' + weekLabel, completed: 0, total: 0 };
    }
    weeklyMap[weekLabel].total++;
    if (status === 'Completed') weeklyMap[weekLabel].completed++;

    const monthLabel = dStr.substring(0, 7);
    if (!monthlyMap[monthLabel]) {
      monthlyMap[monthLabel] = { monthLabel, completed: 0, total: 0 };
    }
    monthlyMap[monthLabel].total++;
    if (status === 'Completed') monthlyMap[monthLabel].completed++;
  }

  const weekdayBreakdown = {};
  let bestDay = 'N/A', maxPct = -1;
  let worstDay = 'N/A', minPct = 101;

  for (const [day, val] of Object.entries(weekdayTotals)) {
    const pct = val.t > 0 ? Math.round((val.c / val.t) * 100) : 0;
    weekdayBreakdown[day] = pct;

    if (val.t > 0) {
      if (pct > maxPct) { maxPct = pct; bestDay = day; }
      if (pct < minPct) { minPct = pct; worstDay = day; }
    }
  }

  const sortedWeeks = Object.keys(weeklyMap).sort().slice(-12);
  const weeklySeries = sortedWeeks.map(wk => ({
    weekLabel: weeklyMap[wk].weekLabel,
    completed: weeklyMap[wk].completed,
    total: weeklyMap[wk].total,
    completionPct: weeklyMap[wk].total > 0 ? Math.round((weeklyMap[wk].completed / weeklyMap[wk].total) * 100) : 0
  }));

  const sortedMonths = Object.keys(monthlyMap).sort().slice(-12);
  const monthlySeries = sortedMonths.map(mo => ({
    monthLabel: monthlyMap[mo].monthLabel,
    completed: monthlyMap[mo].completed,
    total: monthlyMap[mo].total,
    completionPct: monthlyMap[mo].total > 0 ? Math.round((monthlyMap[mo].completed / monthlyMap[mo].total) * 100) : 0
  }));

  return {
    weekdayBreakdown,
    bestDay: bestDay !== 'N/A' ? `${bestDay} (${maxPct}%)` : 'N/A',
    worstDay: worstDay !== 'N/A' ? `${worstDay} (${minPct}%)` : 'N/A',
    weeklySeries,
    monthlySeries
  };
}

function getCategories_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DailyTasks');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const catMap = {};

  for (let r = 1; r < data.length; r++) {
    const cat = String(data[r][6] || 'General').trim();
    const status = String(data[r][3]).trim();

    if (!catMap[cat]) catMap[cat] = { category: cat, completed: 0, missed: 0, total: 0 };
    catMap[cat].total++;

    if (status === 'Completed') catMap[cat].completed++;
    else if (status === 'Missed') catMap[cat].missed++;
  }

  return Object.values(catMap).map(c => ({
    category: c.category,
    completed: c.completed,
    missed: c.missed,
    total: c.total,
    completionPct: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
  }));
}

function getMissed_() {
  const config = getConfig_();
  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DailyTasks');

  const emptyResult = { missedToday: [], missedThisWeekByDay: {}, frequentlySkipped: [] };
  if (!sheet || sheet.getLastRow() <= 1) return emptyResult;

  const data = sheet.getDataRange().getValues();
  const missedToday = [];
  const missedThisWeekByDay = {};
  
  const last30DaysTaskStats = {};
  const todayDateObj = new Date(todayStr);

  for (let r = 1; r < data.length; r++) {
    const dStr = formatDateString_(data[r][0], config.timezone);
    const taskName = String(data[r][2] || '').trim();
    const status = String(data[r][3] || '').trim();

    if (!dStr || !taskName) continue;

    const rowDateObj = new Date(dStr);
    const diffDays = Math.round((todayDateObj - rowDateObj) / (1000 * 60 * 60 * 24));

    if (dStr === todayStr && status === 'Missed') {
      missedToday.push(taskName);
    }

    if (diffDays >= 0 && diffDays < 7 && status === 'Missed') {
      if (!missedThisWeekByDay[dStr]) missedThisWeekByDay[dStr] = [];
      missedThisWeekByDay[dStr].push(taskName);
    }

    if (diffDays >= 0 && diffDays < 30) {
      if (!last30DaysTaskStats[taskName]) {
        last30DaysTaskStats[taskName] = { missed: 0, total: 0 };
      }
      last30DaysTaskStats[taskName].total++;
      if (status === 'Missed') {
        last30DaysTaskStats[taskName].missed++;
      }
    }
  }

  const frequentlySkipped = [];
  for (const [tName, s] of Object.entries(last30DaysTaskStats)) {
    if (s.total > 0) {
      const missRatePct = Math.round((s.missed / s.total) * 100);
      if (missRatePct > 30 && s.missed > 0) {
        frequentlySkipped.push({
          taskName: tName,
          missRatePct,
          missedCount: s.missed,
          totalScheduled: s.total
        });
      }
    }
  }

  frequentlySkipped.sort((a, b) => b.missRatePct - a.missRatePct);

  return {
    missedToday,
    missedThisWeekByDay,
    frequentlySkipped
  };
}


// ==========================================
// 4. OTHER GET & POST HANDLERS
// ==========================================

function handleGetDashboard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashSheet = ss.getSheetByName('Dashboard');
  const metrics = {};
  
  if (dashSheet && dashSheet.getLastRow() > 1) {
    const data = dashSheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      const k = String(data[r][0]).trim();
      const v = data[r][1];
      if (k) metrics[k] = v;
    }
  }

  const today = handleGetToday_();
  const streaks = handleGetStreaks_();

  return {
    metrics: metrics,
    todaySummary: {
      total: today.length,
      completed: today.filter(t => t.status === 'Completed').length,
      pending: today.filter(t => t.status === 'Pending').length,
      missed: today.filter(t => t.status === 'Missed').length
    },
    topStreaks: streaks.slice(0, 5)
  };
}

function handleGetToday_() {
  try {
    fetchAndSyncAllTasks_();
  } catch (err) {
    Logger.log('Sync note in handleGetToday_: ' + err.message);
  }

  const config = getConfig_();
  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DailyTasks');
  
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const tasks = [];

  for (let r = 1; r < data.length; r++) {
    const dateStr = formatDateString_(data[r][0], config.timezone);
    if (dateStr === todayStr) {
      tasks.push({
        date: dateStr,
        taskId: String(data[r][1]),
        taskName: String(data[r][2]),
        status: String(data[r][3]),
        completedAt: data[r][4] ? String(data[r][4]) : null,
        priority: String(data[r][5] || 'Medium'),
        category: String(data[r][6] || 'General'),
        isOptional: Boolean(data[r][7])
      });
    }
  }
  return tasks;
}

function handleGetStreaks_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Streaks');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const streaks = [];
  for (let r = 1; r < data.length; r++) {
    if (data[r][0]) {
      streaks.push({
        task: String(data[r][0]),
        current: parseInt(data[r][1], 10) || 0,
        best: parseInt(data[r][2], 10) || 0
      });
    }
  }
  return streaks;
}

function handleGetGoals_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Goals');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const goals = [];
  for (let r = 1; r < data.length; r++) {
    if (data[r][0]) {
      goals.push({
        task: String(data[r][0]),
        period: String(data[r][1] || 'Daily'),
        target: parseFloat(data[r][2]) || 0,
        unit: String(data[r][3] || 'times')
      });
    }
  }
  return goals;
}

function handleGetNotes_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Notes');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const notes = [];
  for (let r = 1; r < data.length; r++) {
    if (data[r][0]) {
      notes.push({
        date: formatDateString_(data[r][0], config.timezone),
        mood: String(data[r][1] || ''),
        energy: String(data[r][2] || ''),
        wins: String(data[r][3] || ''),
        challenges: String(data[r][4] || '')
      });
    }
  }
  return notes;
}

function handleGetSettings_() {
  const config = getConfig_();
  return {
    timezone: config.timezone,
    cutoffHour: config.cutoffHour,
    categoryMap: config.categoryMap
  };
}

function handleGetGoogleTasksLists_() {
  try {
    const taskListsResponse = Tasks.Tasklists.list();
    const items = taskListsResponse.items || [];
    return items.map(function(list) {
      return {
        id: list.id,
        title: list.title || 'Default'
      };
    });
  } catch (err) {
    Logger.log('Error fetching Google Tasks lists: ' + err.message);
    return [];
  }
}

function handleGetBackup_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = ['Config', 'DailyTasks', 'Streaks', 'Goals', 'Notes', 'Dashboard'];
  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sheets: {}
  };

  tabs.forEach(function(tabName) {
    const sheet = ss.getSheetByName(tabName);
    if (sheet && sheet.getLastRow() > 0) {
      backupData.sheets[tabName] = sheet.getDataRange().getValues();
    } else {
      backupData.sheets[tabName] = [];
    }
  });

  return backupData;
}

function handleRestoreBackup_(payload) {
  const backup = payload.backup || payload.data || payload;
  if (!backup || !backup.sheets) {
    return { success: false, error: 'Invalid backup format. Missing sheets object.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsObj = backup.sheets;

  for (const [tabName, rows] of Object.entries(sheetsObj)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    sheet.clear();
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  }

  try {
    calculateStreaks_();
    updateDashboard_();
  } catch(e){}

  return { success: true, message: 'Backup restored successfully!' };
}

function handleCompleteTask_(payload) {
  const taskId = payload.taskId;
  const taskName = payload.taskName;
  const targetCompleted = payload.completed !== undefined ? Boolean(payload.completed) : true;

  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DailyTasks');
  
  if (!sheet) return { success: false, error: 'DailyTasks sheet missing' };

  let rowToUpdate = -1;
  let matchedTaskId = taskId;
  const data = sheet.getDataRange().getValues();
  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);

  for (let r = 1; r < data.length; r++) {
    const rowTaskId = String(data[r][1]).trim();
    const rowTaskName = String(data[r][2]).trim();
    const rowDateStr = formatDateString_(data[r][0], config.timezone);

    if ((taskId && rowTaskId === String(taskId)) || (taskName && rowTaskName === taskName && rowDateStr === todayStr)) {
      rowToUpdate = r + 1;
      matchedTaskId = rowTaskId;
      break;
    }
  }

  if (matchedTaskId) {
    try {
      const taskListsResponse = Tasks.Tasklists.list();
      const lists = taskListsResponse.items || [];
      for (const list of lists) {
        try {
          const task = Tasks.Tasks.get(list.id, matchedTaskId);
          if (task && task.id) {
            task.status = targetCompleted ? 'completed' : 'needsAction';
            if (!targetCompleted) task.completed = null;
            Tasks.Tasks.patch(task, list.id, matchedTaskId);
            break;
          }
        } catch(e){}
      }
    } catch(err) {
      Logger.log('Google Tasks API update note: ' + err.message);
    }
  }

  const newStatus = targetCompleted ? 'Completed' : 'Pending';
  const completedAtStr = targetCompleted ? Utilities.formatDate(new Date(), config.timezone, "yyyy-MM-dd HH:mm:ss") : '';

  if (rowToUpdate > 0) {
    sheet.getRange(rowToUpdate, 4).setValue(newStatus);
    sheet.getRange(rowToUpdate, 5).setValue(completedAtStr);
  } else {
    sheet.appendRow([todayStr, matchedTaskId || ('manual-' + Date.now()), taskName || 'Manual Task', newStatus, completedAtStr, 'Medium', 'General', false]);
  }

  calculateStreaks_();
  updateDashboard_();

  return {
    success: true,
    taskId: matchedTaskId,
    status: newStatus,
    completedAt: completedAtStr
  };
}

function handleAddNote_(payload) {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Notes');
  if (!sheet) {
    setupInitialSheet();
    sheet = ss.getSheetByName('Notes');
  }

  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);
  const noteDate = payload.date || todayStr;
  const mood = payload.mood || '';
  const energy = payload.energy || '';
  const wins = payload.wins || '';
  const challenges = payload.challenges || '';

  sheet.appendRow([noteDate, mood, energy, wins, challenges]);

  return { success: true, message: 'Note added successfully' };
}

function handleSetGoal_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Goals');
  if (!sheet) {
    setupInitialSheet();
    sheet = ss.getSheetByName('Goals');
  }

  const task = payload.task;
  const period = payload.period || 'Daily';
  const target = payload.target || 1;
  const unit = payload.unit || 'times';

  if (!task) return { success: false, error: 'Task name required' };

  const data = sheet.getDataRange().getValues();
  let updated = false;

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]).trim().toLowerCase() === task.trim().toLowerCase() && String(data[r][1]).trim().toLowerCase() === period.trim().toLowerCase()) {
      sheet.getRange(r + 1, 3).setValue(target);
      sheet.getRange(r + 1, 4).setValue(unit);
      updated = true;
      break;
    }
  }

  if (!updated) {
    sheet.appendRow([task, period, target, unit]);
  }

  return { success: true, message: 'Goal saved successfully' };
}

function handleUpdateSettings_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Config');
  if (!sheet) {
    setupInitialSheet();
    sheet = ss.getSheetByName('Config');
  }

  if (payload.timezone) {
    updateConfigSetting_(sheet, 'Timezone', payload.timezone);
  }
  if (payload.cutoffHour !== undefined) {
    updateConfigSetting_(sheet, 'Day Cutoff Hour', payload.cutoffHour);
  }

  return { success: true, message: 'Settings updated successfully' };
}

function updateConfigSetting_(sheet, settingName, settingValue) {
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let r = 0; r < data.length; r++) {
    if (String(data[r][0]).trim().toLowerCase() === settingName.toLowerCase()) {
      sheet.getRange(r + 1, 2).setValue(settingValue);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([settingName, settingValue]);
  }
}


// ==========================================
// 5. CORE SYNC ENGINE (UNCHANGED)
// ==========================================

function getConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  
  let defaultTz = 'Asia/Kolkata';
  try {
    if (typeof Session !== 'undefined' && Session.getScriptTimeZone) {
      defaultTz = Session.getScriptTimeZone() || 'Asia/Kolkata';
    }
  } catch(e){}

  const config = {
    categoryMap: {},
    timezone: defaultTz,
    cutoffHour: 4
  };

  if (!sheet) return config;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return config;

  let inSettingsSection = false;

  for (let i = 1; i < data.length; i++) {
    const colA = String(data[i][0] || '').trim();
    const colB = String(data[i][1] || '').trim();

    if (colA.startsWith('---') || colA.toLowerCase() === 'settings') {
      inSettingsSection = true;
      continue;
    }

    if (!inSettingsSection) {
      if (colA && colB) {
        config.categoryMap[colA.toLowerCase()] = colB;
      }
    } else {
      if (colA.toLowerCase() === 'timezone' && colB) {
        config.timezone = colB;
      } else if (colA.toLowerCase() === 'day cutoff hour' && colB !== '') {
        config.cutoffHour = parseInt(colB, 10) || 0;
      }
    }
  }

  return config;
}

function getAdjustedTodayDateString_(timezone, cutoffHour) {
  const now = new Date();
  const adjusted = new Date(now.getTime() - (cutoffHour * 60 * 60 * 1000));
  return Utilities.formatDate(adjusted, timezone, 'yyyy-MM-dd');
}

/**
 * Safely extracts date-only YYYY-MM-DD from ISO strings or Date objects
 * without re-interpreting midnight UTC due dates as local instant offsets.
 */
function extractDateOnlyString_(dateObjOrStr) {
  if (!dateObjOrStr) return '';
  const s = String(dateObjOrStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toISOString().substring(0, 10);
    }
  } catch(e){}
  return s.substring(0, 10);
}

function formatDateString_(dateObjOrStr, timezone) {
  if (!dateObjOrStr) return '';
  const s = String(dateObjOrStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.substring(0, 10);
  return Utilities.formatDate(d, timezone || 'Asia/Kolkata', 'yyyy-MM-dd');
}

function fetchAndSyncAllTasks_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DailyTasks');
  if (!sheet) {
    setupInitialSheet();
    sheet = ss.getSheetByName('DailyTasks');
  }

  let taskListsResponse;
  try {
    taskListsResponse = Tasks.Tasklists.list();
  } catch (e) {
    Logger.log('Error fetching task lists: ' + e.message);
    return;
  }

  const taskLists = taskListsResponse.items || [];
  if (taskLists.length === 0) return;

  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);
  const existingData = sheet.getDataRange().getValues();
  
  const taskRowMap = new Map();
  for (let r = 1; r < existingData.length; r++) {
    const taskId = String(existingData[r][1]).trim();
    if (taskId) {
      taskRowMap.set(taskId, r + 1);
    }
  }

  const newRows = [];
  const updateOps = [];

  taskLists.forEach(list => {
    const listTitle = list.title || 'Default';
    const mappedCategory = config.categoryMap[listTitle.toLowerCase()];
    const listCategory = mappedCategory || 'General';

    let tasksResponse;
    try {
      tasksResponse = Tasks.Tasks.list(list.id, {
        showCompleted: true,
        showHidden: true,
        showDeleted: false
      });
    } catch (err) {
      Logger.log(`Failed to fetch tasks for list ${listTitle}: ${err.message}`);
      return;
    }

    const tasks = tasksResponse.items || [];

    tasks.forEach(task => {
      if (!task.id || !task.title) return;

      const title = task.title;
      const notes = task.notes || '';
      const combinedText = `${title} ${notes}`;

      let priority = 'Medium';
      if (/#high/i.test(combinedText)) priority = 'High';
      else if (/#low/i.test(combinedText)) priority = 'Low';
      else if (/#medium/i.test(combinedText)) priority = 'Medium';

      const isOptional = /#optional/i.test(combinedText) || /#opt/i.test(combinedText);

      // Fix: Use date-only string slicing for task.due to avoid timezone shifting
      let taskDateStr = todayStr;
      if (task.due) {
        taskDateStr = extractDateOnlyString_(task.due);
      } else if (task.completed) {
        taskDateStr = extractDateOnlyString_(task.completed);
      }

      let status = 'Pending';
      let completedAtStr = '';

      if (task.status === 'completed') {
        status = 'Completed';
        if (task.completed) {
          completedAtStr = String(task.completed).replace('T', ' ').replace('Z', '').substring(0, 19);
        } else {
          completedAtStr = Utilities.formatDate(new Date(), config.timezone, "yyyy-MM-dd HH:mm:ss");
        }
      } else if (taskDateStr && taskDateStr < todayStr) {
        status = 'Missed';
      } else {
        status = 'Pending';
      }

      const rowValues = [
        taskDateStr,
        task.id,
        title,
        status,
        completedAtStr,
        priority,
        listCategory,
        isOptional ? true : false
      ];

      if (taskRowMap.has(task.id)) {
        const rowIndex = taskRowMap.get(task.id);
        updateOps.push({ rowIndex, rowValues });
      } else {
        newRows.push(rowValues);
      }
    });
  });

  updateOps.forEach(op => {
    sheet.getRange(op.rowIndex, 1, 1, op.rowValues.length).setValues([op.rowValues]);
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
}

function markStalePendingAsMissed_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DailyTasks');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);

  for (let r = 1; r < data.length; r++) {
    const rowDate = formatDateString_(data[r][0], config.timezone);
    const status = String(data[r][3]).trim();

    if (status === 'Pending' && rowDate && rowDate < todayStr) {
      sheet.getRange(r + 1, 4).setValue('Missed');
    }
  }
}

function calculateStreaks_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dailySheet = ss.getSheetByName('DailyTasks');
  let streakSheet = ss.getSheetByName('Streaks');

  if (!streakSheet) {
    setupInitialSheet();
    streakSheet = ss.getSheetByName('Streaks');
  }

  if (!dailySheet || dailySheet.getLastRow() <= 1) return;

  const data = dailySheet.getDataRange().getValues();
  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);

  const taskLogs = new Map();

  for (let r = 1; r < data.length; r++) {
    const taskName = String(data[r][2] || '').trim();
    const status = String(data[r][3] || '').trim();
    const dateStr = formatDateString_(data[r][0], config.timezone);
    const isOptional = Boolean(data[r][7]);

    if (!taskName || !dateStr) continue;

    if (!taskLogs.has(taskName)) {
      taskLogs.set(taskName, []);
    }
    taskLogs.get(taskName).push({ date: dateStr, status, isOptional });
  }

  const streakResults = [];

  taskLogs.forEach((logs, taskName) => {
    logs.sort((a, b) => a.date.localeCompare(b.date));

    const dailyMap = new Map();
    logs.forEach(log => {
      if (!dailyMap.has(log.date) || log.status === 'Completed') {
        dailyMap.set(log.date, log);
      }
    });

    const uniqueDates = Array.from(dailyMap.keys()).sort();
    
    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;

    uniqueDates.forEach(d => {
      const entry = dailyMap.get(d);
      if (entry.status === 'Completed') {
        runningStreak++;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else {
        if (!entry.isOptional && d < todayStr) {
          runningStreak = 0;
        }
      }
    });

    let curr = 0;
    const todayFormatted = todayStr;

    for (let i = 0; i < 365; i++) {
      const targetDateStr = Utilities.formatDate(
        new Date(new Date().getTime() - (i * 24 * 60 * 60 * 1000) - (config.cutoffHour * 60 * 60 * 1000)),
        config.timezone,
        'yyyy-MM-dd'
      );

      const entry = dailyMap.get(targetDateStr);

      if (targetDateStr === todayFormatted && (!entry || entry.status === 'Pending')) {
        continue;
      }

      if (entry && entry.status === 'Completed') {
        curr++;
      } else if (entry && entry.isOptional) {
        continue;
      } else {
        break;
      }
    }

    currentStreak = curr;
    streakResults.push([taskName, currentStreak, bestStreak]);
  });

  streakSheet.clearContents();
  streakSheet.getRange(1, 1, 1, 3).setValues([['Task', 'Current', 'Best']]).setFontWeight('bold');

  if (streakResults.length > 0) {
    streakSheet.getRange(2, 1, streakResults.length, 3).setValues(streakResults);
  }
}

function updateDashboard_() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dailySheet = ss.getSheetByName('DailyTasks');
  const streakSheet = ss.getSheetByName('Streaks');
  let dashSheet = ss.getSheetByName('Dashboard');

  if (!dashSheet) {
    setupInitialSheet();
    dashSheet = ss.getSheetByName('Dashboard');
  }

  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);

  let todayCompleted = 0;
  let todayTotal = 0;
  const missedTodayList = [];

  if (dailySheet && dailySheet.getLastRow() > 1) {
    const dailyData = dailySheet.getDataRange().getValues();
    for (let r = 1; r < dailyData.length; r++) {
      const rowDate = formatDateString_(dailyData[r][0], config.timezone);
      const taskName = String(dailyData[r][2] || '').trim();
      const status = String(dailyData[r][3] || '').trim();

      if (rowDate === todayStr) {
        todayTotal++;
        if (status === 'Completed') {
          todayCompleted++;
        } else if (status === 'Missed') {
          missedTodayList.push(taskName);
        }
      }
    }
  }

  const completionPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) + '%' : '0%';
  const completedTotalStr = `${todayCompleted} / ${todayTotal}`;
  const missedTodayStr = missedTodayList.length > 0 ? missedTodayList.join(', ') : 'None';

  let longestSingleStreak = 0;
  let overallCurrentStreak = 0;

  if (streakSheet && streakSheet.getLastRow() > 1) {
    const streakData = streakSheet.getDataRange().getValues();
    let minTaskCurrent = Infinity;

    for (let r = 1; r < streakData.length; r++) {
      const current = parseInt(streakData[r][1], 10) || 0;
      const best = parseInt(streakData[r][2], 10) || 0;

      if (best > longestSingleStreak) longestSingleStreak = best;
      if (current < minTaskCurrent) minTaskCurrent = current;
    }

    if (minTaskCurrent !== Infinity) {
      overallCurrentStreak = minTaskCurrent;
    }
  }

  const dashboardData = [
    ['Metric', 'Value'],
    ["Today's Completion %", completionPct],
    ["Today's Completed / Total", completedTotalStr],
    ['Overall Current Streak', `${overallCurrentStreak} days`],
    ['Longest Streak (Any Task)', `${longestSingleStreak} days`],
    ['Missed Today', missedTodayStr],
    ['Last Updated', Utilities.formatDate(new Date(), config.timezone, "yyyy-MM-dd HH:mm:ss")]
  ];

  dashSheet.clearContents();
  dashSheet.getRange(1, 1, dashboardData.length, 2).setValues(dashboardData);
  dashSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
}

/**
 * Diagnostics menu tool: logs and writes detailed date calculation breakdown
 * to the "Diagnostics" sheet tab for troubleshooting timezone/date bucket issues.
 */
function runSyncDiagnostics() {
  const config = getConfig_();
  const scriptTz = (typeof Session !== 'undefined' && Session.getScriptTimeZone) ? Session.getScriptTimeZone() : 'N/A';
  const todayStr = getAdjustedTodayDateString_(config.timezone, config.cutoffHour);

  Logger.log('=== HABIT TRACKER SYNC DIAGNOSTICS ===');
  Logger.log('Today Date String (todayStr): ' + todayStr);
  Logger.log('Configured Timezone: ' + config.timezone);
  Logger.log('Script Native Timezone: ' + scriptTz);
  Logger.log('Day Cutoff Hour: ' + config.cutoffHour);

  const diagRows = [
    ['--- DIAGNOSTIC METRIC ---', '--- VALUE / DETAILS ---'],
    ['Today Date String (todayStr)', todayStr],
    ['Configured Timezone', config.timezone],
    ['Script Native Timezone', scriptTz],
    ['Day Cutoff Hour', config.cutoffHour],
    ['System Date (Now)', new Date().toISOString()],
    ['', ''],
    ['List Title', 'Task Title', 'Raw task.due', 'Parsed Due Date (Date-Only)', 'Raw task.completed', 'Parsed Completed Date', 'Assigned Date Bucket', 'Status']
  ];

  try {
    const taskListsResponse = Tasks.Tasklists.list();
    const items = taskListsResponse.items || [];

    items.forEach(function(list) {
      const listTitle = list.title || 'Default';
      let tasksResponse;
      try {
        tasksResponse = Tasks.Tasks.list(list.id, { showCompleted: true, showHidden: true, showDeleted: false });
      } catch (e) {
        return;
      }

      const tasks = tasksResponse.items || [];
      tasks.forEach(function(task) {
        if (!task.id || !task.title) return;
        
        const rawDue = task.due || '';
        const parsedDue = rawDue ? extractDateOnlyString_(rawDue) : '';
        const rawCompleted = task.completed || '';
        const parsedCompleted = rawCompleted ? extractDateOnlyString_(rawCompleted) : '';

        let assignedDate = todayStr;
        if (rawDue) assignedDate = parsedDue;
        else if (rawCompleted) assignedDate = parsedCompleted;

        let status = task.status === 'completed' ? 'Completed' : (assignedDate < todayStr ? 'Missed' : 'Pending');

        diagRows.push([
          listTitle,
          task.title,
          rawDue,
          parsedDue,
          rawCompleted,
          parsedCompleted,
          assignedDate,
          status
        ]);

        Logger.log(`[Diagnostic Task] "${task.title}" | Raw Due: "${rawDue}" -> Parsed: "${parsedDue}" | Raw Completed: "${rawCompleted}" -> Parsed: "${parsedCompleted}" | Bucket: "${assignedDate}" | Status: ${status}`);
      });
    });
  } catch (err) {
    Logger.log('Diagnostics task fetch error: ' + err.message);
    diagRows.push(['Error Fetching Tasks', err.message]);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Diagnostics');
  if (!sheet) {
    sheet = ss.insertSheet('Diagnostics');
  } else {
    sheet.clearContents();
  }

  sheet.getRange(1, 1, diagRows.length, diagRows[0].length).setValues(diagRows);
  sheet.getRange(1, 1, 1, diagRows[0].length).setFontWeight('bold');
  sheet.getRange(8, 1, 1, diagRows[7].length).setFontWeight('bold');

  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    try {
      SpreadsheetApp.getUi().alert('Sync Diagnostics complete!\n\nToday Date: ' + todayStr + '\nConfigured Timezone: ' + config.timezone + '\n\nFull task diagnostic details written to the "Diagnostics" sheet tab.');
    } catch(e){}
  }

  return diagRows;
}
